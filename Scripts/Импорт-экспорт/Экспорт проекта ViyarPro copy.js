
var DEBUG = false;
const PROGRAM_NAME = 'БазисСкрипт';
const SCRIPT_VERSION = '5.3';
const OBJ_TREE_FILE_NAME = 'ObjTree.js';
const NOTEPAD_DEFAULT_PATH = 'C:/Windows/notepad.exe';
const PROPERTIES_FILE = 'Экспорт проекта ViyarPro.xml';
const PATH_FILE = 'Экспорт проекта ViyarPro.path';
const VIYAR_PRO_PROJECT_FILE = 'Файл проекта ViyarPro: ';

const POSITION_NAME_FORMAT = 'Позиция.Наименование';
const DESIGNATION_NAME_FORMAT = 'Обозначение.Наименование';
const ORDER_POSITION_NAME_FORMAT = 'Заказ.Позиция.Наименование';
const ORDER_DESIGNATION_NAME_FORMAT = 'Заказ.Обозначение.Наименование';
const NAME_FORMAT = 'Наименование';

const ELEM_LINE_TYPE = 1;
const ELEM_ARC_TYPE = 2;
const ELEM_CIRCLE_TYPE = 3;

const BUTT_WIDTH_MANUFACT_RULE = 3;

const PANEL_TEXTURE_UNDEFINED = 0;
const PANEL_TEXTURE_HORIZONTAL = 1;
const PANEL_TEXTURE_VERTICAL = 2;

const PANEL_FACE_SIDE_1 = 0;
const PANEL_FACE_SIDE_2 = 1;
const PANEL_FACE_UNDEFINED = 2;

const HOLE_THRU_TYPE = 1;
const HOLE_BLIND_TYPE = 2;
const MIN_HOLE_DEPTH = 1
const MAX_HOLE_DEPTH = 34;
const MIN_HOLE_MARGIN = 1;

const ALERT_TIMEOUT = 100 * 1000;
const HINT_TIMEOUT = 140;

const PRECISION = 0.1;
const DELTA = 4.0;
const THRESHOLD = 10.0;


const VIYAR_MINIMUM_RADIUS = 3.0;

var contourLog = '';
var grooveLog = '';
var coordsLog = '';
var sawingLog = '';
var debugLog = '';

var panels = [];
panels.add = function (panel) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].isEqual(panel)) {
            this[i].quantity++;
            return;
        }
    }
    this.push(panel);
};

function Panel(modelPanel, material) {
    this.quantity = 1;
    this.name = modelPanel.Name;
    var panelThickness = modelPanel.Thickness;
    this.thickness = panelThickness;
    this.artPos = modelPanel.ArtPos;
    this.designation = '';
    if (system.apiVersion >= 1100) {
        this.designation = modelPanel.Designation;
    }
    this.texture = modelPanel.TextureOrientation;
    this.material = material;
    this.face = PANEL_FACE_UNDEFINED;
    if (system.apiVersion >= 1100) {
        this.face = modelPanel.FrontFace;
    }
    this.leftButt = undefined;
    this.topButt = undefined;
    this.rightButt = undefined;
    this.bottomButt = undefined;

    var contour = NewContour();
    contour.AddList(modelPanel.Contour.MakeCopy());
    var orderedContour = NewContour();
    modelPanel.FindOrderedContour(orderedContour);

    var minX = findMinX(orderedContour);
    var minY = findMinY(orderedContour);
    var maxX = findMaxX(orderedContour);
    var maxY = findMaxY(orderedContour);
    var panelLength = maxX - minX;
    var panelWidth = maxY - minY;
    this.length = panelLength;
    this.width = panelWidth;

    orderedContour.Move(minX * -1.0, minY * -1.0);
    this.orderedContour = orderedContour;
    contour.Move(minX * -1.0, minY * -1.0);
    this.contour = contour;

    var contourMinX = findMinX(modelPanel.Contour);
    var contourMinY = findMinY(modelPanel.Contour);
    var contourMaxX = findMaxX(modelPanel.Contour);
    var contourMaxY = findMaxY(modelPanel.Contour);
    var contourSizeX = contourMaxX - contourMinX;
    var contourSizeY = contourMaxY - contourMinY;
    for (var i = 0; i < modelPanel.Contour.Count; i++) {
        var elem = modelPanel.Contour[i];
        var butt = new Butt(elem);
        if ((elem.ElType == ELEM_LINE_TYPE) && butt.isExist) {
            if (cmpr(elem.Pos1.x, contourMinX) && cmpr(elem.Pos2.x, contourMinX)) {
                if (cmpr(elem.ObjLength(), contourSizeY)) {
                    this.leftButt = butt;
                }
            }
            else if (cmpr(elem.Pos1.y, contourMaxY) && cmpr(elem.Pos2.y, contourMaxY)) {
                if (cmpr(elem.ObjLength(), contourSizeX)) {
                    this.topButt = butt;
                }
            }
            else if (cmpr(elem.Pos1.x, contourMaxX) && cmpr(elem.Pos2.x, contourMaxX)) {
                if (cmpr(elem.ObjLength(), contourSizeY)) {
                    this.rightButt = butt;
                }
            }
            else if (cmpr(elem.Pos1.y, contourMinY) && cmpr(elem.Pos2.y, contourMinY)) {
                if (cmpr(elem.ObjLength(), contourSizeX)) {
                    this.bottomButt = butt;
                }
            }
        }
    }
    if (modelPanel.Contour.IsContourRectangle()) {
        this.rectangle = true;
    }
    else {
        this.rectangle = false;
    }
    for (var i = 0; i < modelPanel.Contour.Count; i++) {
        var butt = new Butt(modelPanel.Contour[i]);
        if (butt.isExist) {
            butts.add(butt);
        }
    }
    var cuts = [];
    if (modelPanel.Cuts != undefined) {
        for (var i = 0; i < modelPanel.Cuts.Count; i++) {
            var panelCut = modelPanel.Cuts[i];
            var cut = {};
            cut.name = panelCut.Name;
            cut.sign = panelCut.Sign;
            cut.mode = panelCut.CutMode;
            cut.type = panelCut.CutType;
            cut.panelElem = panelCut.IndexOfPanelElem;
            cut.depth = 0;
            if (system.apiVersion >= 1000) {
                cut.depth = panelCut.Thickness;
            }
            if ((system.apiVersion >= 1000) && (panelCut.Contour.Count > 0) && (panelCut.Trajectory.Count == 0)) {
                cut.trajectory = NewContour();
                cut.trajectory.AddList(panelCut.Contour.MakeCopy());
                cut.trajectory.Move(minX * -1.0, minY * -1.0);
                cut.profile = NewContour();
            }
            else {
                cut.trajectory = NewContour();
                cut.trajectory.AddList(panelCut.Trajectory.MakeCopy());
                cut.trajectory.Move(minX * -1.0, minY * -1.0);

                cut.profile = NewContour();
                cut.profile.AddList(panelCut.Contour.MakeCopy());
            }
            cuts.push(cut);
        }
    }
    this.cuts = cuts;

    var holes = [];
    globalHoles.forEach(function (globalHole) {
        if (globalHole.passed == false) {
            holePos = modelPanel.GlobalToObject(globalHole.pos);
            holeEndPos = modelPanel.GlobalToObject(globalHole.endPos);
            holeDir = modelPanel.NToObject(globalHole.dir);

            if (cmpr(holeDir.x, 0) && cmpr(holeDir.y, 0) && modelPanel.Contour.IsPointInside(holePos)) {
                if (cmpr(holePos.z, 0) && cmpr(holeDir.z, 1)) {
                    if ((globalHole.depth + MIN_HOLE_MARGIN) < panelThickness) {
                        var holeType = HOLE_BLIND_TYPE;
                        var holeDepth = globalHole.depth;
                        globalHole.passed = true;
                    }
                    else {
                        var holeType = HOLE_THRU_TYPE;
                        var holeDepth = panelThickness;
                        if (cmpr(globalHole.depth, panelThickness)) {
                            globalHole.passed = true;
                        }
                    }
                    addHole(holes, holePos.x - minX, holePos.y - minY, 0, 0, 0, 1,
                        globalHole.diameter, holeType, holeDepth);
                }
                else if (cmpr(holePos.z, panelThickness) && cmpr(holeDir.z, -1)) {
                    if ((globalHole.depth + MIN_HOLE_MARGIN) < panelThickness) {
                        var holeType = HOLE_BLIND_TYPE;
                        var holeDepth = globalHole.depth;
                        globalHole.passed = true;
                    }
                    else {
                        var holeType = HOLE_THRU_TYPE;
                        var holeDepth = panelThickness;
                        if (cmpr(globalHole.depth, panelThickness)) {
                            globalHole.passed = true;
                        }
                    }
                    addHole(holes, holePos.x - minX, holePos.y - minY, panelThickness, 0, 0, -1,
                        globalHole.diameter, holeType, holeDepth);
                }
                else if ((holePos.z < 0) && cmpr(holeDir.z, 1) &&
                    (holeEndPos.z > MIN_HOLE_DEPTH) && ((holeEndPos.z + MIN_HOLE_MARGIN) < panelThickness)) {
                    addHole(holes, holePos.x - minX, holePos.y - minY, 0, 0, 0, 1,
                        globalHole.diameter, HOLE_BLIND_TYPE, holeEndPos.z);
                }
                else if ((holePos.z > panelThickness) && cmpr(holeDir.z, -1) &&
                    (holeEndPos.z > MIN_HOLE_MARGIN) && ((holeEndPos.z + MIN_HOLE_DEPTH) < panelThickness)) {
                    addHole(holes, holePos.x - minX, holePos.y - minY, panelThickness, 0, 0, -1,
                        globalHole.diameter, HOLE_BLIND_TYPE, panelThickness - holeEndPos.z);
                }
                else if ((holePos.z < 0) && cmpr(holeDir.z, 1) && ((holeEndPos.z + MIN_HOLE_MARGIN) >= panelThickness)) {
                    addHole(holes, holePos.x - minX, holePos.y - minY, 0, 0, 0, 1,
                        globalHole.diameter, HOLE_THRU_TYPE, panelThickness);
                }
                else if ((holePos.z > panelThickness) && cmpr(holeDir.z, -1) && (holeEndPos.z <= MIN_HOLE_MARGIN)) {
                    addHole(holes, holePos.x - minX, holePos.y - minY, panelThickness, 0, 0, -1,
                        globalHole.diameter, HOLE_THRU_TYPE, panelThickness);
                }
                else if (cmpr(holeEndPos.z, 0) && cmpr(holeDir.z, -1)) {
                    if ((globalHole.depth + MIN_HOLE_MARGIN) < panelThickness) {
                        var holeType = HOLE_BLIND_TYPE;
                        var holeDepth = globalHole.depth;
                        globalHole.passed = true;
                    }
                    else {
                        var holeType = HOLE_THRU_TYPE;
                        var holeDepth = panelThickness;
                        if (cmpr(globalHole.depth, panelThickness)) {
                            globalHole.passed = true;
                        }
                    }
                    addHole(holes, holeEndPos.x - minX, holeEndPos.y - minY, 0, 0, 0, 1,
                        globalHole.diameter, holeType, holeDepth);
                }
                else if (cmpr(holeEndPos.z, panelThickness) && cmpr(holeDir.z, 1)) {
                    if ((globalHole.depth + MIN_HOLE_MARGIN) < panelThickness) {
                        var holeType = HOLE_BLIND_TYPE;
                        var holeDepth = globalHole.depth;
                        globalHole.passed = true;
                    }
                    else {
                        var holeType = HOLE_THRU_TYPE;
                        var holeDepth = panelThickness;
                        if (cmpr(globalHole.depth, panelThickness)) {
                            globalHole.passed = true;
                        }
                    }
                    addHole(holes, holeEndPos.x - minX, holeEndPos.y - minY, panelThickness, 0, 0, -1,
                        globalHole.diameter, holeType, holeDepth);
                }
            }
            if (cmpr(holeDir.z, 0) &&
                (((cmpr(holeDir.x, -1) || cmpr(holeDir.x, 1)) && cmpr(holeDir.y, 0)) ||
                    ((cmpr(holeDir.y, -1) || cmpr(holeDir.y, 1)) && cmpr(holeDir.x, 0))) &&
                (holePos.z > 0) && (holePos.z < panelThickness) && modelPanel.Contour.IsPointInside(holeEndPos)) {
                holeAxis = NewContour();
                holeAxis.AddLine(holePos.x, holePos.y, holeEndPos.x, holeEndPos.y);
                for (var i = 0; i < modelPanel.Contour.Count; i++) {
                    var orderedElem = getOrderedElem(modelPanel, i);
                    var distanceToHolePos = orderedElem.DistanceToPoint(holePos);
                    var distanceToHoleEndPos = orderedElem.DistanceToPoint(holeEndPos);
                    if ((orderedElem.IsIntersected(holeAxis[0]) || cmpr(distanceToHolePos, 0)) && (distanceToHoleEndPos > MIN_HOLE_DEPTH)) {
                        var holePosX = holePos.x - minX;
                        var holePosY = holePos.y - minY;
                        var holeDepth = globalHole.depth;

                        if (cmpr(holeDir.x, -1) && (cmpr(holePosX, panelLength) || (holePosX > panelLength))) {
                            holePosX = panelLength;
                            holeDepth = distanceToHoleEndPos;
                            addHole(holes, holePosX, holePosY, holePos.z, -1, 0, 0,
                                globalHole.diameter, HOLE_BLIND_TYPE, holeDepth);
                        }
                        else if (cmpr(holeDir.x, 1) && (cmpr(holePosX, 0) || (holePosX < 0))) {
                            holePosX = 0;
                            holeDepth = distanceToHoleEndPos;
                            addHole(holes, holePosX, holePosY, holePos.z, 1, 0, 0,
                                globalHole.diameter, HOLE_BLIND_TYPE, holeDepth);
                        }
                        else if (cmpr(holeDir.y, -1) && (cmpr(holePosY, panelWidth) || (holePosY > panelWidth))) {
                            holePosY = panelWidth;
                            holeDepth = distanceToHoleEndPos;
                            addHole(holes, holePosX, holePosY, holePos.z, 0, -1, 0,
                                globalHole.diameter, HOLE_BLIND_TYPE, holeDepth);
                        }
                        else if (cmpr(holeDir.y, 1) && (cmpr(holePosY, 0) || (holePosY < 0))) {
                            holePosY = 0;
                            holeDepth = distanceToHoleEndPos;
                            addHole(holes, holePosX, holePosY, holePos.z, 0, 1, 0,
                                globalHole.diameter, HOLE_BLIND_TYPE, holeDepth);
                        }
                        if (cmpr(distanceToHolePos, 0)) {
                            globalHole.passed = true;
                        }
                    }
                }
                holeAxis.Free;
            }
        }
    });
    this.holes = holes;

    this.isEqual = function (panel) {
        if ((this.artPos == panel.artPos) && (this.designation == panel.designation)) {
            return true;
        }
        return false;
    };
}

var globalHoles = [];
function GlobalHole(modelHole, pos, endPos, dir) {
    this.pos = pos;
    this.endPos = endPos;
    this.dir = dir;
    this.diameter = modelHole.Diameter;
    this.depth = modelHole.Depth;
    this.passed = false;
}

function addHole(holes, posX, posY, posZ, dirX, dirY, dirZ, diameter, type, depth) {
    var hole = {};
    hole.posX = posX;
    hole.posY = posY;
    hole.posZ = posZ;
    hole.dirX = dirX;
    hole.dirY = dirY;
    hole.dirZ = dirZ;
    hole.diameter = diameter;
    hole.type = type;
    hole.depth = depth;
    holes.push(hole);
}

var furns = [];
furns.getIndex = function (furn) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].isEqual(furn)) {
            return i;
        }
    }
    return -1;
};
furns.add = function (furn) {
    arr = furn.code.split(',');
    if (arr.length > 1) {
        for (var j = 0; j < arr.length; j++) {
            var code = arr[j].trim();
            if (code != '') {
                var newFurn = new Furn(furn.name + '\n' + code, furn.artPos);
                var index = this.getIndex(newFurn);
                if (index != -1) {
                    this[index].quantity++;
                }
                else {
                    this.push(newFurn);
                }
            }
        }
    }
    else if (furn.code != '') {
        var index = this.getIndex(furn);
        if (index != -1) {
            this[index].quantity++;
        }
        else {
            this.push(furn);
        }
    }
};

function Furn(nameCode, artPos) {
    var arr = splitNameCode(nameCode);
    this.name = arr[0];
    this.code = arr[1];
    this.artPos = artPos;
    this.quantity = 1;

    this.isEqual = function (furn) {
        if (this.code == furn.code) {
            return true;
        }
        return false;
    };
}

var butts = [];
butts.add = function (butt) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].isEqual(butt)) {
            return;
        }
    }
    this.push(butt);
};

butts.getIndex = function (butt) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].isEqual(butt)) {
            return i;
        }
    }
    return -1;
};

function Butt(elem) {
    if ((elem != undefined) && (elem.Data.Butt != null) && (elem.Data.Butt != undefined)) {
        var butt = elem.Data.Butt;
        var arr = splitNameCode(butt.Material);
        this.name = arr[0];
        this.code = arr[1];
        this.sign = butt.Sign;
        this.thickness = butt.Thickness;
        this.width = butt.Width;
        this.clip = butt.ClipPanel;
        this.length = elem.ObjLength();
        this.isExist = true;
    }
    else {
        this.name = '';
        this.code = '';
        this.thickness = 0;
        this.isExist = false;
    }

    this.isEqual = function (butt) {
        if (this.isExist && butt.isExist) {
            if ((this.name == butt.name) && (this.code == butt.code) &&
                (this.width == butt.width) && (this.thickness == butt.thickness)) {
                return true;
            }
        }
        else if (!this.isExist && !butt.isExist) {
            return true;
        }
        return false;
    };
}

var materials = [];
materials.add = function (material) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].isEqual(material)) {
            return;
        }
    }
    this.push(material);
};
materials.getIndex = function (comboValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].comboValue == comboValue) {
            return i;
        }
    }
    return -1;
};

function Material(nameCode, thickness) {
    var arr = splitNameCode(nameCode);
    var name = arr[0];
    var multiplicity = 1;
    if ((name.search(/сращ.\(3\)/i) != -1) || (name.search(/cращ.\(3\)/i) != -1)) {
        name = name.replace(/сращ.\(3\)/i, '').replace(/cращ.\(3\)/i, '');
        name = name.trim();
        multiplicity = 3;
    }
    else if ((name.search(/сращ.\(2\)/i) != -1) || (name.search(/cращ.\(2\)/i) != -1)) {
        name = name.replace(/сращ.\(2\)/i, '').replace(/cращ.\(2\)/i, '');
        name = name.trim();
        multiplicity = 2;
    }
    this.name = name;
    this.code = arr[1];
    this.thickness = thickness / multiplicity;
    this.multiplicity = multiplicity;

    this.isEqual = function (material) {
        if ((this.name == material.name) && (this.code == material.code) && (this.thickness == material.thickness)) {
            return true;
        }
        return false;
    };
    Object.defineProperty(this, "comboValue", {
        get: function () {
            if (this.code != '') {
                return this.code + '; ' + this.name;
            }
            else {
                return this.name;
            }
        }
    });
}

Model.forEachPanel(function (modelPanel) {
    if ((modelPanel != undefined) && (modelPanel != null) && (isAsmChild(modelPanel) == false) && (isDraftChild(modelPanel) == false)) {
        materials.add(new Material(modelPanel.MaterialName, modelPanel.Thickness));
    }
});

var exportFileName;

if (system.fileExists(OBJ_TREE_FILE_NAME) == false) {
    alert('Файл ' + OBJ_TREE_FILE_NAME + ' не найден!');
}
else if (activateModelTree()) {
    if (materials.length > 0) {
        materials.sort(function (a, b) {
            if (a.thickness > 18) { return 1; }
            if (b.thickness > 18) { return -1; }
            if (a.thickness > b.thickness) { return -1; }
            if (a.thickness < b.thickness) { return 1; }
            return 0;
        });
        var materialsList = '';
        for (var i = 0; i < materials.length; i++) {
            materialsList += materials[i].comboValue + '\n';
        }
        materialsList = materialsList.substr(0, materialsList.length - 1);

        var formatsList = POSITION_NAME_FORMAT + '\n';
        if (system.apiVersion >= 1100) {
            formatsList += DESIGNATION_NAME_FORMAT + '\n';
            formatsList += ORDER_POSITION_NAME_FORMAT + '\n';
            formatsList += ORDER_DESIGNATION_NAME_FORMAT + '\n';
        }
        else {
            formatsList += ORDER_POSITION_NAME_FORMAT + '\n';
        }
        formatsList += NAME_FORMAT;

        var prop = Action.Properties;
        var materialCombo = prop.NewCombo('Материал деталей', materialsList);
        var formatCombo = prop.NewCombo('Формат наименования деталей', formatsList);
        var attachCheckBox = prop.NewBool('Присоединять фурнитуру');
        var exportFileSelector = prop.NewSelector('Eksport file name');
        var exportBtn = prop.NewButton('Eksporting');

        if (system.fileExists(PROPERTIES_FILE)) {
            prop.Load(PROPERTIES_FILE);
        }
        else {
            formatCombo.Value = POSITION_NAME_FORMAT;
            formatCombo.ItemIndex = 0;
            attachCheckBox.Value = true;
        }
        materialCombo.Value = materials[0].comboValue;
        materialCombo.ItemIndex = 0;

        exportFileName = getExportFileName();
        exportFileSelector.Value = exportFileName;
        Action.Hint = VIYAR_PRO_PROJECT_FILE + exportFileName;

        exportFileSelector.OnClick = function () {
            if (system.apiVersion < 1000) {
                var newFileName = system.askFileName('project');
            }
            else {
                var newFileName = system.askFileNameSave('project');
            }
            if ((newFileName != null) && (newFileName != '')) {
                var fileExt = newFileName.substring(newFileName.lastIndexOf("."));
                if (fileExt != '.project') {
                    newFileName += '.project';
                }
                exportFileName = newFileName;
                exportFileSelector.Value = exportFileName;
                Action.Hint = VIYAR_PRO_PROJECT_FILE + exportFileName;
            }
        };

        exportBtn.OnClick = function () {
            if (exportFileSelector.Value != '') {
                exportViyarPro();
                prop.Save(PROPERTIES_FILE);
                Action.Finish();
            }
            else {
                alert('Файл проекта не выбран!');
            }
        };

        exportFileSelector.OnChange = function () {
            exportFileName = exportFileSelector.Value;
            Action.Hint = VIYAR_PRO_PROJECT_FILE + exportFileName;
        };

        materialCombo.OnChange = function () {
            exportFileName = getExportFileName();
            exportFileSelector.Value = exportFileName;
            Action.Hint = VIYAR_PRO_PROJECT_FILE + exportFileName;
        };

        Action.Continue();
    }
    else {
        alert('Отсутствуют экспортируемые детали!');
    }
}

function exportViyarPro() {
    system.require(OBJ_TREE_FILE_NAME);
    if (arrangePositions() == true) {
        Model.UnHighlightAll();
        Action.Hint = 'Проверка проекта... ';
        if (validateProject() && checkManufactRule()) {
            if (readModel() == true) {
                var XMLDoc = createDocNode();
                xotree = new XML.ObjTree();
                xotree.xmlDecl = '<?xml version="1.0" encoding="windows-1251" ?>';
                xml = xotree.writeXML(XMLDoc);

                if (system.fileExists(exportFileName)) {
                    if (confirm('Перезаписать файл? \n' + exportFileName)) {
                        system.writeTextFile(exportFileName, xml);
                        report();
                    } else {
                        alert('Файл не сохранен!');
                    }
                }
                else {
                    system.writeTextFile(exportFileName, xml);
                    alert('Файл сохранен: \n' + exportFileName);
                    report();
                }
            }
        }
    }
}

function report() {
    var log = 'В ViyarPro необходимо:\r\n';
    log += '- проверить проект на соответствие технологическим ограничениям;\r\n' + '\r\n';
    if (contourLog != '') {
        log += '- дополнить чертежами или добавить обработки контура деталей:\r\n' + contourLog + '\r\n';
    }
    if (grooveLog != '') {
        log += '- проверить экспорт следующих пазов:\r\n' + grooveLog + '\r\n';
    }
    if (coordsLog != '') {
        log += '- проверить координаты сверления и пазов деталей:\r\n' + coordsLog + '\r\n';
    }
    if (sawingLog != '') {
        log += '- проверить пильные размеры деталей:\r\n' + sawingLog + '\r\n';
    }
    if (debugLog != '') {
        log += '- отладочная информация:\r\n' + debugLog + '\r\n';
    }
    var logFileName = exportFileName.substr(0, exportFileName.length - '.project'.length) + '.txt';
    system.writeTextFile(logFileName, log);
    if (DEBUG == false) {
        if (system.fileExists(NOTEPAD_DEFAULT_PATH)) {
            system.exec(NOTEPAD_DEFAULT_PATH, '/a "%PATH%"'.replace('%PATH%', logFileName));
        }
        else {
            system.require(PATH_FILE);
            if ((NOTEPAD_PATH != undefined) && system.fileExists(NOTEPAD_PATH)) {
                system.exec(NOTEPAD_PATH, '/a "%PATH%"'.replace('%PATH%', logFileName));
            }
        }
    }
}

function readModel() {
    var exitFlag = false;
    var startTime = Date.now();
    var alertTime = startTime;
    var hintTime = startTime;

    Action.Hint = 'Обработка фурнитуры... ';
    Model.forEach(function (modelObj) {
        if ((modelObj != undefined) && (modelObj != null)) {
            if ((modelObj.constructor.name == "TFastener") || (modelObj.constructor.name == "TAsmKit") || (modelObj.constructor.name == "TFurnAsm")) {
                if ((isAsmKitChild(modelObj) == false) && (isAsmChild(modelObj) == false) && (isDraftChild(modelObj) == false)) {
                    //var objOwner = modelObj.Owner;
                    //debugLog += 'ObjName: ' + modelObj.Name + ' ; OwnerName: ' + objOwner.Name + ' ; OwnerConstructorName: ' + objOwner.constructor.name + '\n';
                    furns.add(new Furn(modelObj.Name, modelObj.ArtPos));
                }

            }
        }
    });
    furns.sort(function (a, b) {
        var ac = parseFloat(a.code);
        var bc = parseFloat(b.code);
        if (isNaN(ac) && isNaN(bc)) { return 0; }
        if (isNaN(ac)) { return 1; }
        if (isNaN(bc)) { return -1; }
        if (ac > bc) { return 1; }
        if (ac < bc) { return -1; }
        return 0;
    });
    Model.forEach(function (modelObj) {
        if ((modelObj != undefined) && (modelObj.Holes != null)) {
            for (var i = 0; i < modelObj.Holes.Count; i++) {
                var modelHole = modelObj.Holes[i];
                globalHoles.push(new GlobalHole(modelHole,
                    modelObj.ToGlobal(modelHole.Position),
                    modelObj.ToGlobal(modelHole.EndPosition()),
                    modelObj.NToGlobal(modelHole.Direction)));
            }
        }
    });
    materialIndex = materials.getIndex(materialCombo.Value);
    if (materialIndex == -1) {
        alert('Отсутствует экспортируемый материал!');
        return false;
    }
    Model.forEachPanel(function (modelPanel) {
        if ((exitFlag == false) && (modelPanel != undefined) && (modelPanel != null) &&
            (modelPanel.Bent == false) && (isAsmChild(modelPanel) == false) && (isDraftChild(modelPanel) == false) && (modelPanel.ArtPos != '') &&
            (modelPanel.Plastics.Count == 0)) {
            if ((Date.now() - hintTime) > HINT_TIMEOUT) {
                Action.Hint = 'Обработка панели... ' + modelPanel.Name;
                hintTime = Date.now();
            }
            var panelMaterial = new Material(modelPanel.MaterialName, modelPanel.Thickness);
            if (materials[materialIndex].isEqual(panelMaterial)) {
                var panel = new Panel(modelPanel, panelMaterial);
                adjustOrientation(panel);
                thruHolesToFace(panel);
                limitHolesDepth(panel);
                panels.add(panel);
            }
            if ((Date.now() - alertTime) > ALERT_TIMEOUT) {
                if (confirm('Требуется длительное время. Продолжить? \n')) {
                    alertTime = Date.now();
                }
                else {
                    exitFlag = true;
                }
            }
        }
    });
    panels.sort(function (a, b) {
        if ((a.designation != '') && (b.designation != '')) {
            if (a.designation > b.designation) { return 1; }
            if (a.designation < b.designation) { return -1; }
            return 0;
        }
        else {
            if (parseFloat(a.artPos) > parseFloat(b.artPos)) { return 1; }
            if (parseFloat(a.artPos) < parseFloat(b.artPos)) { return -1; }
            return 0;
        }
    });
    butts.sort(function (a, b) {
        if (a.thickness > b.thickness) { return 1; }
        if (a.thickness < b.thickness) { return -1; }
        return 0;
    });
    if (exitFlag) {
        Action.Hint = 'Прервано пользователем!';
        alert('Прервано пользователем!');
        return false;
    }
    Action.Hint = 'Обработка проекта завершена... ' + (Date.now() - startTime) / 1000 + ' сек. ';
    return true;
}

function arrangePositions() {
    if (DEBUG == false) {
        if (system.apiVersion < 1000) {
            var mainForm = Action.Control.Owner.Owner;
            var modelTree = mainForm.FindComponent("dpModelTree");
            if (modelTree.Visible == true) {
                var frmModelTree = modelTree.FindComponent("FrmModelTree");
                if (frmModelTree != undefined) {
                    var btnArrange = frmModelTree.FindComponent("BtnArrange");
                    if (btnArrange != undefined) {
                        Action.Hint = 'Расстановка позиций...';
                        btnArrange.Click();
                        return true;
                    }
                    else {
                        alert('Недоступна кнопка <Расставить позиции>!');
                        return false;
                    }
                }
                else {
                    alert('Недоступна форма <Структура модели>!');
                    return false;
                }
            }
            else {
                alert('Закрыт инструмент <Структура модели>, запустите скрипт повторно!');
                return false;
            }
        }
        else {
            Action.Hint = 'Расстановка позиций...';
            if (Action.ArrangePositions(0) == true) {
                return true;
            }
        }
        alert('Расстановка позиций не выполнена!');
        return false;
    }
    else {
        return true;
    }
}

function activateModelTree() {
    if (system.apiVersion < 1000) {
        var mainForm = Action.Control.Owner.Owner;
        var modelTree = mainForm.FindComponent("dpModelTree");
        if (modelTree != undefined) {
            if (modelTree.Visible == false) {
                var actModelTree = mainForm.FindComponent("a3ModelTree");
                if (actModelTree != undefined) {
                    actModelTree.Execute();
                }
                else {
                    alert('Недоступно событие <Структура модели>!');
                    return false;
                }
            }
        }
        else {
            alert('Недоступен объект <Структура модели>!');
            return false;
        }
    }
    return true;
}

function isAsmChild(child) {
    var ownerObj = child.Owner;
    while ((ownerObj != null) && (ownerObj != undefined) && !(ownerObj instanceof TModel3D)) {
        if (ownerObj.constructor.name == "TFurnAsm") {
            return true;
        }
        ownerObj = ownerObj.Owner;
    }
    return false;
}

function isAsmKitChild(child) {
    var ownerObj = child.Owner;
    while ((ownerObj != null) && (ownerObj != undefined) && !(ownerObj instanceof TModel3D)) {
        if (ownerObj.constructor.name == "TAsmKit") {
            return true;
        }
        ownerObj = ownerObj.Owner;
    }
    return false;
}

function isDraftChild(child) {
    var ownerObj = child.Owner;
    while ((ownerObj != null) && (ownerObj != undefined) && !(ownerObj instanceof TModel3D)) {
        if (ownerObj.constructor.name == "TDraftBlock") {
            return true;
        }
        ownerObj = ownerObj.Owner;
    }
    return false;
}

function splitNameCode(fullName) {
    var articleKey = '(Артикул';
    var articleStartPos = fullName.lastIndexOf(articleKey);
    var articleEndPos = fullName.lastIndexOf(')');
    if ((articleStartPos > 0) && (articleEndPos > articleStartPos)) {
        var name = fullName.substring(0, articleStartPos).trim();
        var code = fullName.substring(articleStartPos + articleKey.length, articleEndPos).trim();
    }
    else {
        var arr = fullName.split(/\r\n|\r|\n/g);
        var name = arr[0];
        var code = arr[1];
    }
    if (code == undefined) {
        code = '';
    }
    name = name.trim().replace(/["']/g, '');
    code = code.trim();
    return [name, code];
}

function cmpr(val1, val2) {
    return (Math.abs(val1 - val2) < PRECISION) ? true : false;
}

function cmprd(val1, val2) {
    return (Math.abs(val1 - val2) < DELTA) ? true : false;
}

function cmprt(val1, val2) {
    return (Math.abs(val1 - val2) < THRESHOLD) ? true : false;
}

function rnd(val) {
    result = (val + 0.00005).toFixed(1);
    if (result == 0) {
        return 0;
    }
    return result;
}

function rnds(val) {
    result = (val + 0.00005).toFixed(1).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
    if (result == 0) {
        return 0;
    }
    return result;
}

function findMinX(contour) {
    if ((contour[0].ElType == ELEM_LINE_TYPE) || (contour[0].ElType == ELEM_ARC_TYPE)) {
        var minX = contour[0].Pos1.x;
    }
    else if (contour[0].ElType == ELEM_CIRCLE_TYPE) {
        var minX = contour[0].Center.x - contour[0].CirRadius;
    }
    for (var i = 0; i < contour.Count; i++) {
        if (contour[i].ElType == ELEM_LINE_TYPE) {
            if (contour[i].Pos1.x < minX) {
                minX = contour[i].Pos1.x;
            }
            if (contour[i].Pos2.x < minX) {
                minX = contour[i].Pos2.x;
            }
        }
        else if (contour[i].ElType == ELEM_ARC_TYPE) {
            if (contour[i].AngleOnArc(Math.PI) == true) {
                if ((contour[i].Center.x - contour[i].ArcRadius()) < minX) {
                    minX = contour[i].Center.x - contour[i].ArcRadius();
                }
            }
            else {
                if (contour[i].Pos1.x < minX) {
                    minX = contour[i].Pos1.x;
                }
                if (contour[i].Pos2.x < minX) {
                    minX = contour[i].Pos2.x;
                }
            }
        }
        else if (contour[i].ElType == ELEM_CIRCLE_TYPE) {
            if ((contour[i].Center.x - contour[i].CirRadius) < minX) {
                minX = contour[i].Center.x - contour[i].CirRadius;
            }
        }
    }
    return minX;
}

function findMaxX(contour) {
    if ((contour[0].ElType == ELEM_LINE_TYPE) || (contour[0].ElType == ELEM_ARC_TYPE)) {
        var maxX = contour[0].Pos1.x;
    }
    else if (contour[0].ElType == ELEM_CIRCLE_TYPE) {
        var maxX = contour[0].Center.x + contour[0].CirRadius;
    }
    for (var i = 0; i < contour.Count; i++) {
        if (contour[i].ElType == ELEM_LINE_TYPE) {
            if (contour[i].Pos1.x > maxX) {
                maxX = contour[i].Pos1.x;
            }
            if (contour[i].Pos2.x > maxX) {
                maxX = contour[i].Pos2.x;
            }
        }
        else if (contour[i].ElType == ELEM_ARC_TYPE) {
            if ((contour[i].AngleOnArc(0) == true) || (contour[i].AngleOnArc(2 * Math.PI) == true)) {
                if ((contour[i].Center.x + contour[i].ArcRadius()) > maxX) {
                    maxX = contour[i].Center.x + contour[i].ArcRadius();
                }
            }
            else {
                if (contour[i].Pos1.x > maxX) {
                    maxX = contour[i].Pos1.x;
                }
                if (contour[i].Pos2.x > maxX) {
                    maxX = contour[i].Pos2.x;
                }
            }
        }
        else if (contour[i].ElType == ELEM_CIRCLE_TYPE) {
            if ((contour[i].Center.x + contour[i].CirRadius) > maxX) {
                maxX = contour[i].Center.x + contour[i].CirRadius;
            }
        }
    }
    return maxX;
}

function findMinY(contour) {
    if ((contour[0].ElType == ELEM_LINE_TYPE) || (contour[0].ElType == ELEM_ARC_TYPE)) {
        var minY = contour[0].Pos1.y;
    }
    else if (contour[0].ElType == ELEM_CIRCLE_TYPE) {
        var minY = contour[0].Center.y - contour[0].CirRadius;
    }
    for (var i = 0; i < contour.Count; i++) {
        if (contour[i].ElType == ELEM_LINE_TYPE) {
            if (contour[i].Pos1.y < minY) {
                minY = contour[i].Pos1.y;
            }
            if (contour[i].Pos2.y < minY) {
                minY = contour[i].Pos2.y;
            }
        }
        else if (contour[i].ElType == ELEM_ARC_TYPE) {
            if (contour[i].AngleOnArc((3 * Math.PI) / 2) == true) {
                if ((contour[i].Center.y - contour[i].ArcRadius()) < minY) {
                    minY = contour[i].Center.y - contour[i].ArcRadius();
                }
            }
            else {
                if (contour[i].Pos1.y < minY) {
                    minY = contour[i].Pos1.y;
                }
                if (contour[i].Pos2.y < minY) {
                    minY = contour[i].Pos2.y;
                }
            }
        }
        else if (contour[i].ElType == ELEM_CIRCLE_TYPE) {
            if ((contour[i].Center.y - contour[i].CirRadius) < minY) {
                minY = contour[i].Center.y - contour[i].CirRadius;
            }
        }
    }
    return minY;
}

function findMaxY(contour) {
    if ((contour[0].ElType == ELEM_LINE_TYPE) || (contour[0].ElType == ELEM_ARC_TYPE)) {
        var maxY = contour[0].Pos1.y;
    }
    else if (contour[0].ElType == ELEM_CIRCLE_TYPE) {
        var maxY = contour[0].Center.y + contour[0].CirRadius;
    }
    for (var i = 0; i < contour.Count; i++) {
        if (contour[i].ElType == ELEM_LINE_TYPE) {
            if (contour[i].Pos1.y > maxY) {
                maxY = contour[i].Pos1.y;
            }
            if (contour[i].Pos2.y > maxY) {
                maxY = contour[i].Pos2.y;
            }
        }
        else if (contour[i].ElType == ELEM_ARC_TYPE) {
            if (contour[i].AngleOnArc(Math.PI / 2) == true) {
                if ((contour[i].Center.y + contour[i].ArcRadius()) > maxY) {
                    maxY = contour[i].Center.y + contour[i].ArcRadius();
                }
            }
            else {
                if (contour[i].Pos1.y > maxY) {
                    maxY = contour[i].Pos1.y;
                }
                if (contour[i].Pos2.y > maxY) {
                    maxY = contour[i].Pos2.y;
                }
            }
        }
        else if (contour[i].ElType == ELEM_CIRCLE_TYPE) {
            if ((contour[i].Center.y + contour[i].CirRadius) > maxY) {
                maxY = contour[i].Center.y + contour[i].CirRadius;
            }
        }
    }
    return maxY;
}

function getOrderedElem(panel, elem) {
    if (system.apiVersion < 1000) {
        return panel.Contour[elem].Data.OrderedElem;
    }
    else {
        return panel.FindOrderedElem(elem);
    }
    return undefined;
}

function getModelFilePath() {
    if (system.apiVersion < 1000) {
        var fileName = Action.Control.Owner.FileName;
    }
    else {
        var fileName = Action.ModelFilename;
    }
    return fileName.substring(0, fileName.lastIndexOf("\\") + 1);
}

function getModelFileName() {
    if (system.apiVersion < 1000) {
        var fileName = Action.Control.Owner.FileName;
    }
    else {
        var fileName = Action.ModelFilename;
    }
    return fileName.substring(fileName.lastIndexOf("\\") + 1, fileName.lastIndexOf("."));
}

function getModelName() {
    if (system.apiVersion < 1000) {
        modelName = Action.Control.Owner.Article.Name;
    }
    else {
        modelName = Action.Control.Article.Name;
    }
    return modelName;
}

function getOrderName() {
    if (system.apiVersion < 1000) {
        orderName = Action.Control.Owner.Article.OrderName;
    }
    else {
        orderName = Action.Control.Article.OrderName;
    }
    return orderName;
}

function getExportFileName() {
    index = materials.getIndex(materialCombo.Value);
    if (index != -1) {
        var materialName = materials[index].name;
    }
    else {
        var materialName = '';
    }
    materialName = materialName.replace(/[\/\\:*?"<>|]/g, ' ');
    if (DEBUG) {
        var version = '_b' + system.apiVersion + '_s' + SCRIPT_VERSION;
    } else {
        var version = '';
    }
    if (getModelFileName() == '') {
        var fileName = getModelName() + '_' + materialName + version + '_viyar.project';
    }
    else {
        var fileName = getModelFilePath() + getModelFileName() + '_' + materialName + version + '_viyar.project';
    }
    return fileName;
}


function getPanelName(panel) {
    var result = panel.name;
    if (formatCombo.Value == POSITION_NAME_FORMAT) {
        result = panel.artPos + '.' + result;
    }
    else if (formatCombo.Value == DESIGNATION_NAME_FORMAT) {
        result = panel.designation + '.' + result;
    }
    else if (formatCombo.Value == ORDER_POSITION_NAME_FORMAT) {
        result = getOrderName() + '.' + panel.artPos + '.' + result;
    }
    else if (formatCombo.Value == ORDER_DESIGNATION_NAME_FORMAT) {
        result = getOrderName() + '.' + panel.designation + '.' + result;
    }
    if (panel.material.multiplicity > 1) {
        result = result + ' Сращ.(' + panel.material.multiplicity + ')';
    }
    return result;
}

function recognizeInnerCont(panel) {
    var result = true;
    panel.innerContours.forEach(function (contour) {
        var pattern = new CircleShape(contour);
        if (pattern.isExist) {
            panel.patterns.push(pattern);
        }
        else {
            var pattern = new RectShape(contour);
            if (pattern.isExist) {
                panel.patterns.push(pattern);
            }
            else {
                var pattern = new RoundRectShape(contour);
                if (pattern.isExist) {
                    panel.patterns.push(pattern);
                }
                else {
                    result = false;
                }
            }
        }
    });
    return result;
}
