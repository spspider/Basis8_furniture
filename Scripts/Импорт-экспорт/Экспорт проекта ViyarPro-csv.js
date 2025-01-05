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

const VIYAR_UNDEFINED = -1;

const VIYAR_FRONT_SIDE = 1;
const VIYAR_BACK_SIDE = 6;
const VIYAR_LEFT_SIDE = 2;
const VIYAR_TOP_SIDE = 3;
const VIYAR_RIGHT_SIDE = 4;
const VIYAR_BOTTOM_SIDE = 5;

const VIYAR_RABBETING = 1;
const VIYAR_GROOVING = 2;
const VIYAR_BEVEL = 3;

const VIYAR_HORIZONTAL_CUT = 0;
const VIYAR_VERTICAL_CUT = 1;

const VIYAR_BOTH_COVERING = 0;
const VIYAR_HORIZONTAL_COVERING = 1;
const VIYAR_VERTICAL_COVERING = 2;

const VIYAR_WITHOUT_CORNER = 0;
const VIYAR_RADIUS_CORNER = 1;
const VIYAR_ANGLE_CUT_CORNER = 2;
const VIYAR_CUTOUT_CORNER = 3;

const VIYAR_CORNER_OPERATION = 'cornerOperation';
const VIYAR_SHAPE_BY_PATTERN = 'shapeByPattern';
const VIYAR_PATTERN_U_SHAPE = 'uShaped';
const VIYAR_PATTERN_RECTANGULAR = 'rectangular';
const VIYAR_PATTERN_CIRCLE = 'circle';
const VIYAR_PATTERN_ARC = 'arc';
const VIYAR_PATTERN_SMILE = 'smile';

const VIYAR_WITHOUT_EXT = 0;
const VIYAR_WITH_EXT = 1;
const VIYAR_NOT_STANDART_SMILE = 0;
const VIYAR_STANDART_SMILE = 1;
const VIYAR_OUTER_ARC = 0;
const VIYAR_INNER_ARC = 1;

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
        var versionLabel = prop.NewString('Версия', SCRIPT_VERSION);
        var materialCombo = prop.NewCombo('Материал деталей', materialsList);
        var formatCombo = prop.NewCombo('Формат наименования деталей', formatsList);
        var attachCheckBox = prop.NewBool('Присоединять фурнитуру');
        var exportBtn = prop.NewButton('Экспортировать');

        if (system.fileExists(PROPERTIES_FILE)) {
            prop.Load(PROPERTIES_FILE);
        }
        else {
            formatCombo.Value = POSITION_NAME_FORMAT;
            formatCombo.ItemIndex = 0;
            attachCheckBox.Value = true;
        }
        versionLabel.Value = SCRIPT_VERSION;
        versionLabel.Enabled = false;
        materialCombo.Value = materials[0].comboValue;
        materialCombo.ItemIndex = 0;

        exportFileName = getExportFileName();
        Action.Hint = VIYAR_PRO_PROJECT_FILE + exportFileName;



        exportBtn.OnClick = function () {
            exportViyarPro();
            prop.Save(PROPERTIES_FILE);
            Action.Finish();
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
                system.askWriteTextFile(exportFileName.replace('.project', '.csv'), exportCSV(panels));
                report();
            }
        }
    }
}

function exportCSV(panels) {
    var csvRows = [];
    csvRows.push("Nr.;DenumirePiesa;Decor;Lungime;Latime;Nr.Buc.;Fibra;Fata;Spate;Stanga;Dreapta");

    panels.forEach((panel, index) => {
        var leftButt = panel.leftButt && panel.leftButt.isExist ? panel.leftButt.name.toString() : "";
        var topButt = panel.topButt && panel.topButt.isExist ? panel.topButt.name.toString() : "";
        var rightButt = panel.rightButt && panel.rightButt.isExist ? panel.rightButt.name.toString() : "";
        var bottomButt = panel.bottomButt && panel.bottomButt.isExist ? panel.bottomButt.name.toString() : "";
        var name_panel = panel.name.trim().replace(/;/g, '.');
        var name_material_panel = panel.material.name;
        var row = [
            index + 1,
            "\"" + name_panel + " " + panel.artPos + "\"",
            name_material_panel,
            Math.round(panel.width),
            Math.round(panel.length),
            panel.quantity,
            "",
            topButt,
            bottomButt,
            leftButt,
            rightButt
        ].join(";");

        csvRows.push(row);
    });

    return csvRows.join("\n");
}



function adjustPanelsOrientation() {
    panels.forEach(adjustOrientation);
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

function isBlockChild(child) {
    var ownerObj = child.Owner;
    while ((ownerObj != null) && (ownerObj != undefined) && !(ownerObj instanceof TModel3D)) {
        if (ownerObj.constructor.name == "TFurnBlock") {
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

function createDocNode() {
    docNode = {
        project: {
            '-currency': '',
            '-version': '1',
            '-costOperation': '0',
            '-costMaterial': '0',
            '-cost': '0',
            '-date': '',
            '-orderDate': '',
            '-productFilter': false,
            viyar: {
                '-version': 23,
                order: {
                    '-delivery': '',
                    '-uuid': '',
                },
                creator: {
                    '-id': 'Bazis2Viyar',
                    '-version': SCRIPT_VERSION,
                    '-bazisVersion': system.apiVersion,
                },
                constructor: {
                    '-id': 'dsp',
                    '-site': '',
                }
            }
        }
    };
    var viyarNode = docNode.project.viyar;

    viyarNode.materials = {};
    viyarNode.materials.material = [];

    var materialID = 1;
    var offsetID = 2;
    var index = materials.getIndex(materialCombo.Value);
    var materialNode = {};
    materialNode['-id'] = materialID;
    materialNode['-type'] = 'sheet';
    materialNode['-article'] = materials[index].code;
    materialNode['-name'] = materials[index].name;
    materialNode['-width'] = 3000;
    materialNode['-height'] = 3000;
    materialNode['-thickness'] = rnds(materials[index].thickness);
    viyarNode.materials.material.push(materialNode);

    butts.forEach(function (butt) {
        materialID++;
        var materialNode = {};
        materialNode['-id'] = materialID;
        materialNode['-type'] = 'band';
        materialNode['-article'] = butt.code;
        materialNode['-name'] = butt.name;
        materialNode['-height'] = rnds(butt.width);
        materialNode['-thickness'] = rnds(butt.thickness);
        viyarNode.materials.material.push(materialNode);
    });

    viyarNode.details = {};
    viyarNode.details.detail = [];

    var detailID = 0;
    panels.forEach(function (panel) {
        detailID++;
        var detailNode = {};

        panel.patterns = [];
        panel.corners = [];

        var recognized = false;
        if (panel.rectangle == false) {
            panel.innerContours = [];
            var contours = findContours(panel.orderedContour);
            if (contours.length > 1) {
                panel.innerContours = contours.slice(1);
                if (recognizeInnerCont(panel) == false) {
                    contourLog += '№ ' + detailID + ', поз. ' + panel.artPos + ((panel.designation == '') ? '' : (', обозн. ' + panel.designation)) + ', ' + panel.name + ';\r\n';
                }
            }
            if (contours.length > 0) {
                panel.outerContour = contours[0];
                recognized = recognizeOuterCont(panel);
            }
            if ((contours.length == 0) || (recognized == false)) {
                contourLog += '№ ' + detailID + ', поз. ' + panel.artPos + ((panel.designation == '') ? '' : (', обозн. ' + panel.designation)) + ', ' + panel.name + ';\r\n';
                if ((panel.holes.length > 0) || (panel.cuts.length > 0)) {
                    if ((calcLeftLength(panel) == 0) || (calcBottomLength(panel) == 0) ||
                        (findLeftButt(panel).isExist && (panel.leftButt == undefined)) ||
                        (findBottomButt(panel).isExist && (panel.bottomButt == undefined))) {
                        coordsLog += '№ ' + detailID + ', поз. ' + panel.artPos + ((panel.designation == '') ? '' : (', обозн. ' + panel.designation)) + ', ' + panel.name + ';\r\n';
                    }
                }
            }
        }
        detailNode['-id'] = detailID;
        detailNode['-material'] = '1';
        detailNode['-barcode'] = '';
        detailNode['-amount'] = panel.quantity;

        var sawing = sawingSize(panel);
        if (sawing != undefined) {
            detailNode['-width'] = rnd(sawing.length);
            detailNode['-height'] = rnd(sawing.width);
        }
        else {
            detailNode['-width'] = rnd(panel.length);
            detailNode['-height'] = rnd(panel.width);
            sawingLog += '№ ' + detailID + ', поз. ' + panel.artPos + ((panel.designation == '') ? '' : (', обозн. ' + panel.designation)) + ', ' + panel.name + ';\r\n';
        }
        detailNode['-multiplicity'] = panel.material.multiplicity;
        if (panel.texture == PANEL_TEXTURE_HORIZONTAL) {
            detailNode['-grain'] = '1';
        }
        else {
            detailNode['-grain'] = '0';
        }
        detailNode['-description'] = getPanelName(panel);
        detailNode['-marker'] = '0';
        if (panel.face == PANEL_FACE_SIDE_1) {
            detailNode['-decoratedSide'] = 'front';
        }
        else if (panel.face == PANEL_FACE_SIDE_2) {
            detailNode['-decoratedSide'] = 'back';
        }
        var bottomEdgeType = ''; var leftEdgeType = ''; var topEdgeType = ''; var rightEdgeType = '';
        var bottomEdgeParam = 0; var leftEdgeParam = 0; var topEdgeParam = 0; var rightEdgeParam = 0;
        if (recognized) {
            var leftButt = findLeftButt(panel);
            if (leftButt.isExist) {
                leftEdgeType = 'kromka';
                leftEdgeParam = butts.getIndex(leftButt) + offsetID;
            }
            var topButt = findTopButt(panel);
            if (topButt.isExist) {
                topEdgeType = 'kromka';
                topEdgeParam = butts.getIndex(topButt) + offsetID;
            }
            var rightButt = findRightButt(panel);
            if (rightButt.isExist) {
                rightEdgeType = 'kromka';
                rightEdgeParam = butts.getIndex(rightButt) + offsetID;
            }
            var bottomButt = findBottomButt(panel);
            if (bottomButt.isExist) {
                bottomEdgeType = 'kromka';
                bottomEdgeParam = butts.getIndex(bottomButt) + offsetID;
            }
        }
        else {
            if (panel.leftButt != undefined) {
                leftEdgeType = 'kromka';
                leftEdgeParam = butts.getIndex(panel.leftButt) + offsetID;
            }
            if (panel.topButt != undefined) {
                topEdgeType = 'kromka';
                topEdgeParam = butts.getIndex(panel.topButt) + offsetID;
            }
            if (panel.rightButt != undefined) {
                rightEdgeType = 'kromka';
                rightEdgeParam = butts.getIndex(panel.rightButt) + offsetID;
            }
            if (panel.bottomButt != undefined) {
                bottomEdgeType = 'kromka';
                bottomEdgeParam = butts.getIndex(panel.bottomButt) + offsetID;
            }
        }
        var bevels = 0;
        panel.grooves = [];
        panel.cuts.forEach(function (cut) {
            groove = new ViyarGroove(panel, cut);
            if (groove.isExist) {
                panel.grooves.push(groove);
                if (groove.type == VIYAR_BEVEL) {
                    bevels++;
                    if (groove.edge == VIYAR_LEFT_SIDE) {
                        leftEdgeType = 'srez';
                        leftEdgeParam = Math.round(groove.alpha);
                    }
                    else if (groove.edge == VIYAR_TOP_SIDE) {
                        topEdgeType = 'srez';
                        topEdgeParam = Math.round(groove.alpha);
                    }
                    else if (groove.edge == VIYAR_RIGHT_SIDE) {
                        rightEdgeType = 'srez';
                        rightEdgeParam = Math.round(groove.alpha);
                    }
                    else if (groove.edge == VIYAR_BOTTOM_SIDE) {
                        bottomEdgeType = 'srez';
                        bottomEdgeParam = Math.round(groove.alpha);
                    }
                }
            }
            else {
                grooveLog += '№ ' + detailID + ', поз. ' + panel.artPos + ((panel.designation == '') ? '' : (', обозн. ' + panel.designation)) + ', ' + panel.name + ', ' + cut.name + ';\r\n';
            }
        });
        detailNode.edges = {};

        detailNode.edges.left = {};
        detailNode.edges.left['-type'] = leftEdgeType;
        detailNode.edges.left['-param'] = leftEdgeParam;
        detailNode.edges.left['-drop'] = '0';

        detailNode.edges.top = {};
        detailNode.edges.top['-type'] = topEdgeType;
        detailNode.edges.top['-param'] = topEdgeParam;
        detailNode.edges.top['-drop'] = '0';

        detailNode.edges.right = {};
        detailNode.edges.right['-type'] = rightEdgeType;
        detailNode.edges.right['-param'] = rightEdgeParam;
        detailNode.edges.right['-drop'] = '0';

        detailNode.edges.bottom = {};
        detailNode.edges.bottom['-type'] = bottomEdgeType;
        detailNode.edges.bottom['-param'] = bottomEdgeParam;
        detailNode.edges.bottom['-drop'] = '0';

        panel.drillings = [];
        panel.holes.forEach(function (hole) {
            var drilling = new ViyarDrilling(panel, hole);
            if (drilling.isExist) {
                panel.drillings.push(drilling);
            }
        });

        if ((panel.drillings.length > 0) || ((panel.grooves.length > 0) && (panel.grooves.length > bevels)) ||
            (((panel.corners.length > 0) || (panel.patterns.length > 0)) && recognized)) {
            detailNode.operations = {};
            detailNode.operations.operation = [];
            var operationID = 0;

            panel.drillings.forEach(function (drilling) {
                operationID++;
                operNode = {};
                operNode['-id'] = operationID;
                operNode['-type'] = 'drilling';
                operNode['-side'] = drilling.side;
                operNode['-x'] = rnd(drilling.x);
                operNode['-y'] = rnd(drilling.y);
                operNode['-xo'] = rnd(drilling.x);
                operNode['-yo'] = rnd(drilling.y);
                operNode['-xl'] = '0';
                operNode['-yl'] = '0';
                operNode['-d'] = rnds(drilling.diameter);
                operNode['-depth'] = rnd(drilling.depth);
                detailNode.operations.operation.push(operNode);
            });
            panel.grooves.forEach(function (groove) {
                if (groove.type == VIYAR_RABBETING) {
                    operationID++;
                    operNode = {};
                    operNode['-id'] = operationID;
                    operNode['-type'] = 'rabbeting';
                    operNode['-side'] = groove.side;
                    operNode['-subtype'] = '';
                    operNode['-edge'] = groove.edge;
                    operNode['-shift'] = rnd(groove.shift);
                    operNode['-width'] = rnd(groove.width);
                    operNode['-length'] = rnd(groove.length);
                    operNode['-closed'] = groove.closed;
                    operNode['-depth'] = rnd(groove.depth);
                    detailNode.operations.operation.push(operNode);
                }
                else if (groove.type == VIYAR_GROOVING) {
                    operationID++;
                    operNode = {};
                    operNode['-id'] = operationID;
                    operNode['-type'] = 'grooving';
                    operNode['-side'] = groove.side;
                    operNode['-subtype'] = groove.subType;
                    operNode['-x'] = rnd(groove.x);
                    operNode['-y'] = rnd(groove.y);
                    operNode['-width'] = rnd(groove.width);
                    operNode['-length'] = rnd(groove.length);
                    operNode['-closed'] = groove.closed;
                    operNode['-depth'] = rnd(groove.depth);
                    detailNode.operations.operation.push(operNode);
                }
            });
            if (recognized) {
                panel.corners.forEach(function (corner) {
                    operationID++;
                    operNode = {};
                    operNode['-id'] = operationID;
                    operNode['-type'] = VIYAR_CORNER_OPERATION;
                    operNode['-corner'] = corner.crn;
                    operNode['-subtype'] = corner.subType;
                    operNode['-x'] = rnd(corner.x);
                    operNode['-y'] = rnd(corner.y);
                    if (corner.radius > 0) {
                        operNode['-r'] = rnd(corner.radius);
                    }
                    if (corner.subType == VIYAR_CUTOUT_CORNER) {
                        operNode['-ext'] = corner.ext;
                    }
                    if (corner.butt != undefined) {
                        operNode['-edgeMaterial'] = butts.getIndex(corner.butt) + offsetID;
                    }
                    else {
                        operNode['-edgeMaterial'] = '';
                    }
                    operNode['-edgeCovering'] = corner.covering;
                    detailNode.operations.operation.push(operNode);
                });
                panel.patterns.forEach(function (pattern) {
                    if (pattern.patternId == VIYAR_PATTERN_U_SHAPE) {
                        operationID++;
                        operNode = {};
                        operNode['-id'] = operationID;
                        operNode['-type'] = pattern.type;
                        operNode['-direction'] = '0';
                        operNode['-patternId'] = pattern.patternId;
                        operNode['-ext'] = pattern.ext;
                        operNode['-edgeId'] = pattern.edge;
                        operNode['-shift'] = rnd(pattern.shift);
                        operNode['-sizeH'] = rnd(pattern.sizeH);
                        operNode['-sizeV'] = rnd(pattern.sizeV);
                        operNode['-radius'] = rnd(pattern.radius);
                        if (pattern.butt != undefined) {
                            operNode['-edgeMaterial'] = butts.getIndex(pattern.butt) + offsetID;
                        }
                        else {
                            operNode['-edgeMaterial'] = '';
                        }
                        detailNode.operations.operation.push(operNode);
                    }
                    else if (pattern.patternId == VIYAR_PATTERN_RECTANGULAR) {
                        operationID++;
                        operNode = {};
                        operNode['-id'] = operationID;
                        operNode['-type'] = pattern.type;
                        operNode['-patternId'] = pattern.patternId;
                        operNode['-ext'] = pattern.ext;
                        operNode['-shiftX'] = rnd(pattern.shiftX);
                        operNode['-shiftY'] = rnd(pattern.shiftY);
                        operNode['-sizeH'] = rnd(pattern.sizeH);
                        operNode['-sizeV'] = rnd(pattern.sizeV);
                        operNode['-radius'] = rnd(pattern.radius);
                        operNode['-joint'] = '0';
                        if (pattern.butt != undefined) {
                            operNode['-edgeMaterial'] = butts.getIndex(pattern.butt) + offsetID;
                        }
                        else {
                            operNode['-edgeMaterial'] = '';
                        }
                        detailNode.operations.operation.push(operNode);
                    }
                    else if (pattern.patternId == VIYAR_PATTERN_CIRCLE) {
                        operationID++;
                        operNode = {};
                        operNode['-id'] = operationID;
                        operNode['-type'] = pattern.type;
                        operNode['-patternId'] = pattern.patternId;
                        operNode['-shiftX'] = rnd(pattern.shiftX);
                        operNode['-shiftY'] = rnd(pattern.shiftY);
                        operNode['-radius'] = rnd(pattern.radius);
                        operNode['-x'] = rnd(pattern.shiftX);
                        operNode['-y'] = rnd(pattern.shiftY);
                        operNode['-r'] = rnd(pattern.radius);
                        if (pattern.butt != undefined) {
                            operNode['-edgeMaterial'] = butts.getIndex(pattern.butt) + offsetID;
                        }
                        else {
                            operNode['-edgeMaterial'] = '';
                        }
                        operNode['-joint'] = '0';
                        detailNode.operations.operation.push(operNode);
                    }
                    else if (pattern.patternId == VIYAR_PATTERN_ARC) {
                        operationID++;
                        operNode = {};
                        operNode['-id'] = operationID;
                        operNode['-type'] = pattern.type;
                        operNode['-patternId'] = pattern.patternId;
                        operNode['-shift'] = rnd(pattern.shift);
                        operNode['-edgeId'] = pattern.edge;
                        operNode['-inner'] = pattern.inner;
                        if (pattern.butt != undefined) {
                            operNode['-edgeMaterial'] = butts.getIndex(pattern.butt) + offsetID;
                        }
                        else {
                            operNode['-edgeMaterial'] = '';
                        }
                        detailNode.operations.operation.push(operNode);
                    }
                    else if (pattern.patternId == VIYAR_PATTERN_SMILE) {
                        operationID++;
                        operNode = {};
                        operNode['-id'] = operationID;
                        operNode['-type'] = pattern.type;
                        operNode['-patternId'] = pattern.patternId;
                        operNode['-edgeId'] = pattern.edge;
                        operNode['-shift'] = rnd(pattern.shift);
                        operNode['-sizeH'] = rnd(pattern.sizeH);
                        operNode['-sizeV'] = rnd(pattern.sizeV);
                        if (pattern.butt != undefined) {
                            operNode['-edgeMaterial'] = butts.getIndex(pattern.butt) + offsetID;
                        }
                        else {
                            operNode['-edgeMaterial'] = '';
                        }
                        operNode['-standartValue'] = rnd(pattern.value);
                        operNode['-standartCheck'] = pattern.standart;
                        operNode['-center'] = '';
                        operNode['-shiftForNotStandart'] = '0';
                        detailNode.operations.operation.push(operNode);
                    }
                });
            }
        }
        viyarNode.details.detail.push(detailNode);
    });

    if ((attachCheckBox.Value == true) && (furns.length > 0)) {
        var id = 0;
        viyarNode.products = {};
        viyarNode.products.product = [];
        furns.forEach(function (furn) {
            id++;
            var productNode = {};
            productNode['-id'] = id;
            productNode['-article'] = furn.code;
            productNode['-name'] = furn.name;
            productNode['-amount'] = furn.quantity;
            viyarNode.products.product.push(productNode);
        });
    }
    return docNode;
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

function CircleShape(contour) {
    this.isExist = false;
    this.quant = isCircleShape(contour);
    if (this.quant > 0) {
        var i0 = 0;
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_CIRCLE;
        this.shiftX = contour[i0].Center.x;
        this.shiftY = contour[i0].Center.y;
        this.radius = contour[i0].CirRadius;

        this.butt = undefined;
        var butt = new Butt(contour[i0]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isCircleShape(contour) {
    if ((contour.Count == 1) && contour[0].IsCircle()) {
        return 1;
    }
    return 0;
}

function RectShape(contour) {
    this.isExist = false;
    this.quant = isRectShape(contour);
    if (this.quant > 0) {
        var minX = findMinX(contour);
        var maxX = findMaxX(contour);
        var minY = findMinY(contour);
        var maxY = findMaxY(contour);
        if (!cmprt(maxX, minX) && !cmprt(maxY, minY) && (maxX > minX) && (maxY > minY)) {
            var i0 = 0;
            this.type = VIYAR_SHAPE_BY_PATTERN;
            this.patternId = VIYAR_PATTERN_RECTANGULAR;
            this.ext = VIYAR_WITH_EXT;
            this.shiftX = minX;
            this.shiftY = minY;
            this.sizeH = maxX - minX;
            this.sizeV = maxY - minY;
            this.radius = 0;

            this.butt = undefined;
            var butt = new Butt(contour[i0]);
            if (butt.isExist) {
                this.butt = butt;
            }
            this.isExist = true;
        }
    }
}

function isRectShape(contour) {
    if (contour.Count == 4) {
        var i0 = 0;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        var i3 = nextIndex(contour, i2);
        if (contour.IsContourRectangle() && (isVertLine(contour[i0]) || isHorLine(contour[i0]))) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            var butt3 = new Butt(contour[i3]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2) && butt2.isEqual(butt3)) {
                return 4;
            }
        }
    }
    return 0;
}

function RoundRectShape(contour) {
    this.isExist = false;
    for (var index = 0; index < 2; index++) {
        this.quant = isRoundRectShape(contour, index);
        if (this.quant > 0) {
            var minX = findMinX(contour);
            var maxX = findMaxX(contour);
            var minY = findMinY(contour);
            var maxY = findMaxY(contour);
            if (!cmprt(maxX, minX) && !cmprt(maxY, minY) && (maxX > minX) && (maxY > minY)) {
                var i0 = index;
                var i1 = nextIndex(contour, i0);
                this.type = VIYAR_SHAPE_BY_PATTERN;
                this.patternId = VIYAR_PATTERN_RECTANGULAR;
                this.ext = VIYAR_WITHOUT_EXT;
                this.shiftX = minX;
                this.shiftY = minY;
                this.sizeH = maxX - minX;
                this.sizeV = maxY - minY;
                this.radius = contour[i1].ArcRadius();

                this.butt = undefined;
                var butt = new Butt(contour[i0]);
                if (butt.isExist) {
                    this.butt = butt;
                }
                this.isExist = true;
            }
        }
    }
}

function isRoundRectShape(contour, index) {
    if (contour.Count == 8) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        var i3 = nextIndex(contour, i2);
        var i4 = nextIndex(contour, i3);
        var i5 = nextIndex(contour, i4);
        var i6 = nextIndex(contour, i5);
        var i7 = nextIndex(contour, i6);
        if (contour[i0].IsLine() && contour[i1].IsArc() && !contour[i1].ArcDir &&
            contour[i2].IsLine() && contour[i3].IsArc() && !contour[i3].ArcDir &&
            contour[i4].IsLine() && contour[i5].IsArc() && !contour[i5].ArcDir &&
            contour[i6].IsLine() && contour[i7].IsArc() && !contour[i7].ArcDir &&
            (isVertLine(contour[i0]) || isHorLine(contour[i0]) &&
                cmprd(contour[i1].ArcRadius(), contour[i3].ArcRadius()) &&
                cmprd(contour[i3].ArcRadius(), contour[i5].ArcRadius()) &&
                cmprd(contour[i5].ArcRadius(), contour[i7].ArcRadius()))) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            var butt3 = new Butt(contour[i3]);
            var butt4 = new Butt(contour[i4]);
            var butt5 = new Butt(contour[i5]);
            var butt6 = new Butt(contour[i6]);
            var butt7 = new Butt(contour[i7]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2) && butt2.isEqual(butt3) &&
                butt3.isEqual(butt4) && butt4.isEqual(butt5) && butt5.isEqual(butt6) && butt6.isEqual(butt7)) {
                return 8;
            }
        }
    }
    return 0;
}

function recognizeOuterCont(panel) {
    var cntr = 0;
    var maxX = findMaxX(panel.outerContour);
    var maxY = findMaxY(panel.outerContour);
    for (var i = 0; i < panel.outerContour.Count; i++) {
        var elem = panel.outerContour[i];
        if (elem.IsLine()) {
            if (cmpr(elem.Pos1.y, 0) && cmpr(elem.Pos2.y, 0)) {
                cntr++;
            }
            if (cmpr(elem.Pos1.x, 0) && cmpr(elem.Pos2.x, 0)) {
                cntr++;
            }
            if (cmpr(elem.Pos1.y, maxY) && cmpr(elem.Pos2.y, maxY)) {
                cntr++;
            }
            if (cmpr(elem.Pos1.x, maxX) && cmpr(elem.Pos2.x, maxX)) {
                cntr++;
            }
        }
    }
    var contourCopy = NewContour();
    contourCopy.AddList(panel.outerContour.MakeCopy());
    for (var crn = 4; crn > 0; crn--) {
        contourCopy.Rotate(0, 0, -90.0);
        var minX = findMinX(contourCopy);
        var minY = findMinY(contourCopy);
        contourCopy.Move(minX * -1.0, minY * -1.0);
        for (var i = 0; i < contourCopy.Count; i++) {
            var corner = new RadiusCorner(panel, contourCopy, crn, i);
            if (corner.isExist) {
                cntr += corner.quant;
                panel.corners.push(corner);
            }
            else {
                var corner = new AngleCutCorner(panel, contourCopy, crn, i);
                if (corner.isExist) {
                    cntr += corner.quant;
                    panel.corners.push(corner);
                }
                else {
                    var corner = new CutoutCorner(panel, contourCopy, crn, i);
                    if (corner.isExist) {
                        cntr += corner.quant;
                        panel.corners.push(corner);
                    }
                    else {
                        var corner = new RoundCutoutCorner(panel, contourCopy, crn, i);
                        if (corner.isExist) {
                            cntr += corner.quant;
                            panel.corners.push(corner);
                        }
                        else {
                            var pattern = new RectCutout(panel, contourCopy, crn, i);
                            if (pattern.isExist) {
                                cntr += pattern.quant;
                                panel.patterns.push(pattern);
                            }
                            else {
                                var pattern = new RoundRectCutout(panel, contourCopy, crn, i);
                                if (pattern.isExist) {
                                    cntr += pattern.quant;
                                    panel.patterns.push(pattern);
                                }
                                else {
                                    var pattern = new OuterArc(panel, contourCopy, crn, i);
                                    if (pattern.isExist) {
                                        cntr += pattern.quant;
                                        panel.patterns.push(pattern);
                                    }
                                    else {
                                        var pattern = new InnerArc(panel, contourCopy, crn, i);
                                        if (pattern.isExist) {
                                            cntr += pattern.quant;
                                            panel.patterns.push(pattern);
                                        }
                                        else {
                                            var pattern = new StandartSmile(panel, contourCopy, crn, i);
                                            if (pattern.isExist) {
                                                cntr += pattern.quant;
                                                panel.patterns.push(pattern);
                                            }
                                            else {
                                                var pattern = new NotStandartSmile(panel, contourCopy, crn, i);
                                                if (pattern.isExist) {
                                                    cntr += pattern.quant;
                                                    panel.patterns.push(pattern);
                                                }
                                                else {
                                                    var pattern = new HalfCircCutout(panel, contourCopy, crn, i);
                                                    if (pattern.isExist) {
                                                        cntr += pattern.quant;
                                                        panel.patterns.push(pattern);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if ((cntr == contourCopy.Count) && (cntr > 0)) {
        return true;
    }
    return false;
}

function RadiusCorner(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isRadiusCorner(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.subType = VIYAR_RADIUS_CORNER;
        this.crn = crn;
        this.radius = contour[i0].ArcRadius();
        this.x = this.radius;
        this.y = this.radius;
        this.ext = VIYAR_WITHOUT_EXT;

        this.butt = undefined;
        var butt = new Butt(contour[i0]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.covering = VIYAR_BOTH_COVERING;
        this.isExist = true;
    }
}

function isRadiusCorner(contour, index) {
    if (contour.Count > 2) {
        var i0 = index;
        if (contour[i0].IsArc() && !contour[i0].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i0].Pos2.x, 0) &&
            !cmprt(contour[i0].Pos1.y, contour[i0].Center.y) && !cmprt(contour[i0].Pos2.x, contour[i0].Center.x) &&
            cmprd(contour[i0].Center.x, contour[i0].Pos1.x) && cmprd(contour[i0].Center.y, contour[i0].Pos2.y)) {
            return 1;
        }
    }
    return 0;
}

function AngleCutCorner(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isAngleCutCorner(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.subType = VIYAR_ANGLE_CUT_CORNER;
        this.crn = crn;
        this.ext = VIYAR_WITHOUT_EXT;
        this.radius = 0;

        var butt = new Butt(contour[i0]);
        this.x = contour[i0].Pos1.x;
        this.y = contour[i0].Pos2.y;
        var alpha = (Math.atan(this.y / this.x) * 180.0) / Math.PI;

        this.x = this.x + butt.thickness / Math.cos(((90.0 - alpha) * Math.PI) / 180.0);
        this.y = this.y + butt.thickness / Math.cos((alpha * Math.PI) / 180.0);

        if ((crn == 2) || (crn == 4)) {
            if (this.y > panel.length) {
                this.y = panel.length;
                this.x = this.y / Math.tan((alpha * Math.PI) / 180.0);
            }
            if (this.x > panel.width) {
                this.x = panel.width;
                this.y = this.x / Math.tan(((90.0 - alpha) * Math.PI) / 180.0);
            }
            var temp = this.x;
            this.x = this.y;
            this.y = temp;
        }
        else {
            if (this.y > panel.width) {
                this.y = panel.width;
                this.x = this.y / Math.tan((alpha * Math.PI) / 180.0);
            }
            if (this.x > panel.length) {
                this.x = panel.length;
                this.y = this.x / Math.tan(((90.0 - alpha) * Math.PI) / 180.0);
            }
        }
        this.butt = undefined;
        if (butt.isExist) {
            this.butt = butt;
        }
        this.covering = VIYAR_BOTH_COVERING;
        this.isExist = true;
    }
}

function isAngleCutCorner(contour, index) {
    if (contour.Count > 2) {
        var i0 = index;
        if (contour[i0].IsLine() && cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i0].Pos2.x, 0) &&
            !cmprt(contour[i0].Pos2.y, 0) && !cmprt(contour[i0].Pos1.x, 0)) {
            return 1;
        }
    }
    return 0;
}

function CutoutCorner(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isCutoutCorner(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        this.subType = VIYAR_CUTOUT_CORNER;
        this.crn = crn;
        this.ext = VIYAR_WITH_EXT;
        this.radius = 0;

        var vertButt = new Butt(contour[i0]);
        var horButt = new Butt(contour[i1]);
        if ((crn == 2) || (crn == 4)) {
            this.x = contour[i1].Pos1.y + horButt.thickness;
            this.y = contour[i0].Pos2.x + vertButt.thickness;
        }
        else if ((crn == 1) || (crn == 3)) {
            this.x = contour[i0].Pos2.x + vertButt.thickness;
            this.y = contour[i1].Pos1.y + horButt.thickness;
        }
        this.butt = undefined;
        if (vertButt.isExist && horButt.isExist) {
            this.butt = vertButt;
            this.covering = VIYAR_BOTH_COVERING;
        }
        else if (horButt.isExist) {
            this.butt = horButt;
            if ((crn == 1) || (crn == 3)) {
                this.covering = VIYAR_HORIZONTAL_COVERING;
            }
            else {
                this.covering = VIYAR_VERTICAL_COVERING;
            }
        }
        else if (vertButt.isExist) {
            this.butt = vertButt;
            if ((crn == 1) || (crn == 3)) {
                this.covering = VIYAR_VERTICAL_COVERING;
            }
            else {
                this.covering = VIYAR_HORIZONTAL_COVERING;
            }
        }
        else {
            this.covering = VIYAR_BOTH_COVERING;
        }
        this.isExist = true;
    }
}

function isCutoutCorner(contour, index) {
    if (contour.Count > 4) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        if (isVertLine(contour[i0]) && isHorLine(contour[i1]) &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i1].Pos2.x, 0) &&
            !cmprt(contour[i0].Pos2.y, 0) && !cmprt(contour[i1].Pos1.x, 0)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            if (butt0.isExist && butt1.isExist) {
                if (butt0.isEqual(butt1)) {
                    return 2;
                }
                else {
                    return 0;
                }
            }
            return 2;
        }
    }
    return 0;
}

function RoundCutoutCorner(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isRoundCutoutCorner(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.subType = VIYAR_CUTOUT_CORNER;
        this.crn = crn;
        this.ext = VIYAR_WITHOUT_EXT;

        var butt = new Butt(contour[i0]);
        this.radius = contour[i0].ArcRadius() + butt.thickness;
        if ((crn == 2) || (crn == 4)) {
            this.x = contour[i0].Pos2.y + butt.thickness;
            this.y = contour[i0].Pos1.x + butt.thickness;
        }
        else if ((crn == 1) || (crn == 3)) {
            this.x = contour[i0].Pos1.x + butt.thickness;
            this.y = contour[i0].Pos2.y + butt.thickness;
        }

        this.butt = undefined;
        if (butt.isExist) {
            this.butt = butt;
        }
        this.covering = VIYAR_BOTH_COVERING;
        this.isExist = true;
    }
}

function isRoundCutoutCorner(contour, index) {
    if (contour.Count > 3) {
        var i1 = index;
        var i2 = nextIndex(contour, i1);
        var i0 = prevIndex(contour, i1);
        if (isVertLine(contour[i0]) && isHorLine(contour[i2]) &&
            contour[i1].IsArc() && contour[i1].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i2].Pos2.x, 0) &&
            (contour[i0].Pos1.y < contour[i0].Pos2.y) && (contour[i2].Pos2.x < contour[i2].Pos1.x) &&
            cmpr(contour[i1].Center.x, contour[i1].Pos2.x) && cmpr(contour[i1].Center.y, contour[i1].Pos1.y) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2)) {
                return 3;
            }
        }
        else if (isHorLine(contour[i2]) && contour[i1].IsArc() && contour[i1].ArcDir &&
            cmpr(contour[i1].Pos1.y, 0) && cmpr(contour[i2].Pos2.x, 0) && (contour[i2].Pos2.x < contour[i2].Pos1.x) &&
            cmprd(contour[i1].Center.x, contour[i1].Pos2.x) && cmprd(contour[i1].Center.y, contour[i1].Pos1.y) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS)) {
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            if (butt1.isEqual(butt2)) {
                return 2;
            }
        }
        else if (isVertLine(contour[i0]) && contour[i1].IsArc() && contour[i1].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i1].Pos2.x, 0) && (contour[i0].Pos1.y < contour[i0].Pos2.y) &&
            cmprd(contour[i1].Center.x, contour[i1].Pos2.x) && cmprd(contour[i1].Center.y, contour[i1].Pos1.y) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            if (butt0.isEqual(butt1)) {
                return 2;
            }
        }
        else if (contour[i1].IsArc() && contour[i1].ArcDir &&
            cmpr(contour[i1].Pos1.y, 0) && cmpr(contour[i1].Pos2.x, 0) &&
            cmprd(contour[i1].Center.x, 0) && cmprd(contour[i1].Center.y, 0) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS)) {
            return 1;
        }
    }
    return 0;
}

function RectCutout(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isRectCutout(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_U_SHAPE;
        this.ext = VIYAR_WITH_EXT;
        this.radius = 0;

        if (crn == 4) {
            this.edge = VIYAR_RIGHT_SIDE;
            this.shift = contour[i1].Pos2.x;
            this.sizeH = contour[i1].Pos2.y;
            this.sizeV = contour[i1].Pos1.x - contour[i1].Pos2.x;
        }
        else if (crn == 3) {
            this.edge = VIYAR_TOP_SIDE;
            this.shift = panel.length - contour[i1].Pos1.x;
            this.sizeH = contour[i1].Pos1.x - contour[i1].Pos2.x;
            this.sizeV = contour[i1].Pos2.y;
        }
        else if (crn == 2) {
            this.edge = VIYAR_LEFT_SIDE;
            this.shift = panel.width - contour[i1].Pos1.x;
            this.sizeH = contour[i1].Pos2.y;
            this.sizeV = contour[i1].Pos1.x - contour[i1].Pos2.x;
        }
        else if (crn == 1) {
            this.edge = VIYAR_BOTTOM_SIDE;
            this.shift = contour[i1].Pos2.x;
            this.sizeH = contour[i1].Pos1.x - contour[i1].Pos2.x;
            this.sizeV = contour[i1].Pos2.y;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i1]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isRectCutout(contour, index) {
    var i0 = index;
    var i1 = nextIndex(contour, i0);
    var i2 = nextIndex(contour, i1);
    if (contour.Count > 5) {
        if (isVertLine(contour[i0]) && isHorLine(contour[i1]) && isVertLine(contour[i2]) &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i2].Pos2.y, 0) &&
            (contour[i1].Pos2.x < contour[i1].Pos1.x) && !cmprt(contour[i1].Pos2.x, contour[i1].Pos1.x) &&
            !cmprt(contour[i0].Pos2.y, contour[i0].Pos1.y) && !cmprt(contour[i2].Pos2.y, contour[i2].Pos1.y)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2)) {
                return 3;
            }
        }
    }
    return 0;
}

function RoundRectCutout(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isRoundRectCutout(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_U_SHAPE;
        this.ext = VIYAR_WITHOUT_EXT;

        this.radius = contour[i0].ArcRadius();
        if (crn == 4) {
            this.edge = VIYAR_RIGHT_SIDE;
            this.shift = contour[i2].Pos2.x;
            this.sizeH = contour[i1].Pos2.y;
            this.sizeV = contour[i0].Pos1.x - contour[i2].Pos2.x;
        }
        else if (crn == 3) {
            this.edge = VIYAR_TOP_SIDE;
            this.shift = panel.length - contour[i0].Pos1.x;
            this.sizeH = contour[i0].Pos1.x - contour[i2].Pos2.x;
            this.sizeV = contour[i1].Pos2.y;
        }
        else if (crn == 2) {
            this.edge = VIYAR_LEFT_SIDE;
            this.shift = panel.width - contour[i0].Pos1.x;
            this.sizeH = contour[i1].Pos2.y;
            this.sizeV = contour[i0].Pos1.x - contour[i2].Pos2.x;
        }
        else if (crn == 1) {
            this.edge = VIYAR_BOTTOM_SIDE;
            this.shift = contour[i2].Pos2.x;
            this.sizeH = contour[i0].Pos1.x - contour[i2].Pos2.x;
            this.sizeV = contour[i1].Pos2.y;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i1]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isRoundRectCutout(contour, index) {
    if (contour.Count > 6) {
        var i1 = index;
        var i2 = nextIndex(contour, i1);
        var i3 = nextIndex(contour, i2);
        var i4 = nextIndex(contour, i3);
        var i0 = prevIndex(contour, i1);
        if (contour[i0].IsLine() && contour[i1].IsArc() && contour[i2].IsLine() &&
            contour[i3].IsArc() && contour[i4].IsLine() && contour[i1].ArcDir && contour[i3].ArcDir &&
            isVertLine(contour[i0]) && isHorLine(contour[i2]) && isVertLine(contour[i4]) &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i4].Pos2.y, 0) && (contour[i2].Pos2.x < contour[i2].Pos1.x) &&
            cmprd(contour[i1].ArcRadius(), contour[i3].ArcRadius()) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS) && (contour[i3].ArcRadius() >= VIYAR_MINIMUM_RADIUS) &&
            cmpr(contour[i1].Center.y, contour[i1].Pos1.y) && cmpr(contour[i3].Center.y, contour[i3].Pos2.y)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            var butt3 = new Butt(contour[i3]);
            var butt4 = new Butt(contour[i4]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2) &&
                butt2.isEqual(butt3) && butt3.isEqual(butt4)) {
                return 5;
            }
        }
        else if (contour[i1].IsArc() && contour[i2].IsLine() && contour[i3].IsArc() &&
            contour[i1].ArcDir && contour[i3].ArcDir && isHorLine(contour[i2]) &&
            cmpr(contour[i1].Pos1.y, 0) && cmpr(contour[i3].Pos2.y, 0) && (contour[i2].Pos2.x < contour[i2].Pos1.x) &&
            cmprd(contour[i1].ArcRadius(), contour[i3].ArcRadius()) &&
            (contour[i1].ArcRadius() >= VIYAR_MINIMUM_RADIUS) && (contour[i3].ArcRadius() >= VIYAR_MINIMUM_RADIUS) &&
            cmprd(contour[i1].Center.y, contour[i1].Pos1.y) && cmprd(contour[i3].Center.y, contour[i3].Pos2.y)) {
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            var butt3 = new Butt(contour[i3]);
            if (butt1.isEqual(butt2) && butt2.isEqual(butt3)) {
                return 3;
            }
        }
    }
    return 0;
}

function HalfCircCutout(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isHalfCircCutout(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_U_SHAPE;
        this.ext = VIYAR_WITHOUT_EXT;

        this.radius = contour[i0].ArcRadius();
        if (crn == 4) {
            this.edge = VIYAR_RIGHT_SIDE;
            this.shift = contour[i0].Pos2.x;
            this.sizeH = contour[i0].ArcRadius();
            this.sizeV = contour[i0].Pos1.x - contour[i0].Pos2.x;
        }
        else if (crn == 3) {
            this.edge = VIYAR_TOP_SIDE;
            this.shift = panel.length - contour[i0].Pos1.x;
            this.sizeH = contour[i0].Pos1.x - contour[i0].Pos2.x;
            this.sizeV = contour[i0].ArcRadius();
        }
        else if (crn == 2) {
            this.edge = VIYAR_LEFT_SIDE;
            this.shift = panel.width - contour[i0].Pos1.x;
            this.sizeH = contour[i0].ArcRadius();
            this.sizeV = contour[i0].Pos1.x - contour[i0].Pos2.x;
        }
        else if (crn == 1) {
            this.edge = VIYAR_BOTTOM_SIDE;
            this.shift = contour[i0].Pos2.x;
            this.sizeH = contour[i0].Pos1.x - contour[i0].Pos2.x;
            this.sizeV = contour[i0].ArcRadius();
        }

        this.butt = undefined;
        var butt = new Butt(contour[i0]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isHalfCircCutout(contour, index) {
    if (contour.Count > 3) {
        var i0 = index;
        if (contour[i0].IsArc() && contour[i0].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i0].Pos2.y, 0) && cmprd(contour[i0].Center.y, 0) &&
            (contour[i0].Pos2.x < contour[i0].Pos1.x) && (contour[i0].ArcRadius() >= VIYAR_MINIMUM_RADIUS)) {
            return 1;
        }
    }
    return 0;
}

function OuterArc(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isOuterArc(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_ARC;
        this.shift = contour[i0].Pos1.x;
        this.inner = VIYAR_OUTER_ARC;
        if (crn == 4) {
            this.edge = VIYAR_BOTTOM_SIDE;
        }
        else if (crn == 3) {
            this.edge = VIYAR_RIGHT_SIDE;
        }
        else if (crn == 2) {
            this.edge = VIYAR_TOP_SIDE;
        }
        else if (crn == 1) {
            this.edge = VIYAR_LEFT_SIDE;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i0]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isOuterArc(contour, index) {
    if (contour.Count > 1) {
        var i0 = index;
        if (contour[i0].IsArc() && !contour[i0].ArcDir && cmpr(contour[i0].Pos1.y, 0) &&
            cmprd(contour[i0].Pos1.x, contour[i0].Pos2.x) && cmpr(contour[i0].Center.x, contour[i0].ArcRadius()) &&
            !cmprt(contour[i0].Pos2.y, contour[i0].Pos1.y) && cmprd(contour[i0].Center.y, contour[i0].Pos2.y / 2)) {
            return 1;
        }
    }
    return 0;
}

function InnerArc(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isInnerArc(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_ARC;
        this.shift = contour[i0].Center.x + contour[i0].ArcRadius();
        this.inner = VIYAR_INNER_ARC;
        if (crn == 4) {
            this.edge = VIYAR_BOTTOM_SIDE;
        }
        else if (crn == 3) {
            this.edge = VIYAR_RIGHT_SIDE;
        }
        else if (crn == 2) {
            this.edge = VIYAR_TOP_SIDE;
        }
        else if (crn == 1) {
            this.edge = VIYAR_LEFT_SIDE;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i0]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isInnerArc(contour, index) {
    if (contour.Count > 3) {
        var i0 = index;
        if (contour[i0].IsArc() && contour[i0].ArcDir && cmpr(contour[i0].Pos1.y, 0) &&
            cmprd(contour[i0].Pos1.x, contour[i0].Pos2.x) && (cmpr(contour[i0].Pos1.x, 0) || cmpr(contour[i0].Pos2.x, 0)) &&
            !cmprt(contour[i0].Pos2.y, contour[i0].Pos1.y) && cmprd(contour[i0].Center.y, contour[i0].Pos2.y / 2)) {
            return 1;
        }
    }
    return 0;
}

function StandartSmile(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isStandartSmile(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_SMILE;
        this.value = 0;
        this.sizeH = this.value + 220.0;
        this.sizeV = 30.0;
        this.standart = VIYAR_STANDART_SMILE;
        if (crn == 4) {
            this.edge = VIYAR_RIGHT_SIDE;
            this.shift = contour[i2].Pos2.x;
        }
        else if (crn == 3) {
            this.edge = VIYAR_TOP_SIDE;
            this.shift = panel.length - contour[i0].Pos1.x;
        }
        else if (crn == 2) {
            this.edge = VIYAR_LEFT_SIDE;
            this.shift = panel.width - contour[i0].Pos1.x;
        }
        else if (crn == 1) {
            this.edge = VIYAR_BOTTOM_SIDE;
            this.shift = contour[i2].Pos2.x;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i1]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isStandartSmile(contour, index) {
    if (contour.Count > 6) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        if (contour[i0].IsArc() && contour[i1].IsArc() && contour[i2].IsArc() &&
            !contour[i0].ArcDir && contour[i1].ArcDir && !contour[i2].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i2].Pos2.y, 0) &&
            cmprd(contour[i0].ArcRadius(), 95) && cmprd(contour[i1].ArcRadius(), 122) && cmprd(contour[i2].ArcRadius(), 95)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2)) {
                return 3;
            }
        }
    }
    return 0;
}

function NotStandartSmile(panel, contour, crn, index) {
    this.isExist = false;
    this.quant = isNotStandartSmile(contour, index);
    if (this.quant > 0) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        var i3 = nextIndex(contour, i2);
        var i4 = nextIndex(contour, i3);
        this.type = VIYAR_SHAPE_BY_PATTERN;
        this.patternId = VIYAR_PATTERN_SMILE;
        this.value = contour[i2].ObjLength();
        this.sizeH = this.value + 220.0;
        this.sizeV = 30.0;
        this.standart = VIYAR_NOT_STANDART_SMILE;
        if (crn == 4) {
            this.edge = VIYAR_RIGHT_SIDE;
            this.shift = contour[i4].Pos2.x;
        }
        else if (crn == 3) {
            this.edge = VIYAR_TOP_SIDE;
            this.shift = panel.length - contour[i0].Pos1.x;
        }
        else if (crn == 2) {
            this.edge = VIYAR_LEFT_SIDE;
            this.shift = panel.width - contour[i0].Pos1.x;
        }
        else if (crn == 1) {
            this.edge = VIYAR_BOTTOM_SIDE;
            this.shift = contour[i4].Pos2.x;
        }

        this.butt = undefined;
        var butt = new Butt(contour[i2]);
        if (butt.isExist) {
            this.butt = butt;
        }
        this.isExist = true;
    }
}

function isNotStandartSmile(contour, index) {
    if (contour.Count > 7) {
        var i0 = index;
        var i1 = nextIndex(contour, i0);
        var i2 = nextIndex(contour, i1);
        var i3 = nextIndex(contour, i2);
        var i4 = nextIndex(contour, i3);
        if (contour[i0].IsArc() && contour[i1].IsArc() && contour[i2].IsLine() && contour[i3].IsArc() && contour[i4].IsArc() &&
            !contour[i0].ArcDir && contour[i1].ArcDir && contour[i3].ArcDir && !contour[i4].ArcDir &&
            cmpr(contour[i0].Pos1.y, 0) && cmpr(contour[i4].Pos2.y, 0) &&
            cmprd(contour[i0].ArcRadius(), 95) && cmprd(contour[i4].ArcRadius(), 95) &&
            cmprd(contour[i2].Pos1.y, 30) && cmprd(contour[i2].Pos2.y, 30) && !cmprt(contour[i2].Pos2.x, contour[i2].Pos1.x)) {
            var butt0 = new Butt(contour[i0]);
            var butt1 = new Butt(contour[i1]);
            var butt2 = new Butt(contour[i2]);
            var butt3 = new Butt(contour[i3]);
            var butt4 = new Butt(contour[i4]);
            if (butt0.isEqual(butt1) && butt1.isEqual(butt2) && butt2.isEqual(butt3) && butt3.isEqual(butt4)) {
                return 5;
            }
        }
    }
    return 0;
}

function ViyarDrilling(panel, hole) {
    this.isExist = false;
    this.diameter = hole.diameter;
    if (hole.dirX == 1) {
        this.side = VIYAR_LEFT_SIDE;
        this.x = panel.thickness - hole.posZ;
        this.y = hole.posY;
        this.depth = hole.depth;
        this.isExist = true;
    }
    else if (hole.dirX == -1) {
        this.side = VIYAR_RIGHT_SIDE;
        this.x = panel.thickness - hole.posZ;
        this.y = hole.posY;
        this.depth = hole.depth;
        this.isExist = true;
    }
    else if (hole.dirY == 1) {
        this.side = VIYAR_BOTTOM_SIDE;
        this.x = hole.posX;
        this.y = panel.thickness - hole.posZ;
        this.depth = hole.depth;
        this.isExist = true;
    }
    else if (hole.dirY == -1) {
        this.side = VIYAR_TOP_SIDE;
        this.x = hole.posX;
        this.y = panel.thickness - hole.posZ;
        this.depth = hole.depth;
        this.isExist = true;
    }
    else if (hole.dirZ == 1) {
        this.side = VIYAR_BACK_SIDE;
        this.x = hole.posX;
        this.y = hole.posY;
        this.depth = (hole.type == HOLE_BLIND_TYPE) ? (hole.depth) : (panel.thickness + 5);
        this.isExist = true;
    }
    else if (hole.dirZ == -1) {
        this.side = VIYAR_FRONT_SIDE;
        this.x = hole.posX;
        this.y = hole.posY;
        this.depth = (hole.type == HOLE_BLIND_TYPE) ? (hole.depth) : (panel.thickness + 5);
        this.isExist = true;
    }
}

function ViyarGroove(panel, cut) {
    this.isExist = false;
    this.type = VIYAR_UNDEFINED;
    this.subType = VIYAR_UNDEFINED;
    this.depth = 0;
    this.alpha = 0;
    this.shift = 0;
    this.width = 0;
    this.length = 0;
    this.x = 0;
    this.y = 0;
    this.side = VIYAR_UNDEFINED;
    this.edge = VIYAR_UNDEFINED;
    this.closed = 0;

    if (isOrthoLine(cut.trajectory) && isRightTriangle(cut.profile) && cmpr(cut.depth, 0)) {
        for (var i = 0; i < cut.profile.Count; i++) {
            line = cut.profile[i];
            if (isVertLine(line)) {
                edgeX = line.Pos1.x;
            }
            else if (isHorLine(line)) {
                sideY = line.Pos1.y;
            }
        }
        line = cut.trajectory[0];
        this.subType = VIYAR_HORIZONTAL_CUT;
        if (isVertLine(line)) {
            this.subType = VIYAR_VERTICAL_CUT;
        }
        arr = parallel(line.Pos1, line.Pos2, edgeX, false);
        start = arr[0];
        end = arr[1];
        if (cmpr(sideY, 0)) {
            this.side = VIYAR_BACK_SIDE;
        }
        if (cmpr(sideY, panel.thickness)) {
            this.side = VIYAR_FRONT_SIDE;
        }
        if (this.subType == VIYAR_VERTICAL_CUT) {
            if (cmpr(start.x, 0)) {
                this.edge = VIYAR_LEFT_SIDE;
            }
            if (cmpr(start.x, panel.length)) {
                this.edge = VIYAR_RIGHT_SIDE;
            }
        }
        if (this.subType == VIYAR_HORIZONTAL_CUT) {
            if (cmpr(start.y, 0)) {
                this.edge = VIYAR_BOTTOM_SIDE;
            }
            if (cmpr(start.y, panel.width)) {
                this.edge = VIYAR_TOP_SIDE;
            }
        }
        if (cmpr(findMinY(cut.profile), 0) && cmpr(findMaxY(cut.profile), panel.thickness)) {
            var bevelWidth = findMaxX(cut.profile) - findMinX(cut.profile);
            if ((this.edge != VIYAR_UNDEFINED) && !cmpr(bevelWidth, 0)) {
                if (this.side == VIYAR_FRONT_SIDE) {
                    this.type = VIYAR_BEVEL;
                    this.alpha = (Math.atan(bevelWidth / panel.thickness) * 180.0) / Math.PI;
                    this.isExist = true;
                }
                else if (this.side == VIYAR_BACK_SIDE) {
                    this.type = VIYAR_BEVEL;
                    this.alpha = -1.0 * ((Math.atan(bevelWidth / panel.thickness) * 180.0) / Math.PI);
                    this.isExist = true;
                }
            }
        }
    }
    else {
        if ((cut.profile.Count == 0) && cut.trajectory.IsContourRectangle() && !cmpr(cut.depth, 0)) {
            var minX = findMinX(cut.trajectory);
            var maxX = findMaxX(cut.trajectory);
            var minY = findMinY(cut.trajectory);
            var maxY = findMaxY(cut.trajectory);

            this.subType = VIYAR_HORIZONTAL_CUT;
            if ((maxX - minX) < (maxY - minY)) {
                this.subType = VIYAR_VERTICAL_CUT;
            }
            if (cut.depth > 0) {
                var minZ = 0;
                var maxZ = cut.depth;
            }
            else {
                var minZ = panel.thickness + cut.depth;
                var maxZ = panel.thickness;
            }
        }
        else if (isOrthoLine(cut.trajectory) && cut.profile.IsContourRectangle() && cmpr(cut.depth, 0)) {
            line = cut.trajectory[0];
            this.subType = VIYAR_HORIZONTAL_CUT;
            if (isVertLine(line)) {
                this.subType = VIYAR_VERTICAL_CUT;
            }
            var p = [];
            arr = parallel(line.Pos1, line.Pos2, findMinX(cut.profile), false);
            p[0] = arr[0];
            p[2] = arr[1];
            arr = parallel(line.Pos1, line.Pos2, findMaxX(cut.profile), false);
            p[1] = arr[0];
            p[3] = arr[1];

            var i = 0;
            var minX = p[i].x;
            var maxX = minX;
            var minY = p[i].y;
            var maxY = minY;
            while (++i < 4) {
                if (minX > p[i].x) {
                    minX = p[i].x;
                }
                if (maxX < p[i].x) {
                    maxX = p[i].x;
                }
                if (minY > p[i].y) {
                    minY = p[i].y;
                }
                if (maxY < p[i].y) {
                    maxY = p[i].y;
                }
            }
            var minZ = findMinY(cut.profile);
            var maxZ = findMaxY(cut.profile);
        }
        else {
            return;
        }

        if (minX < 0) {
            minX = 0;
        }
        if (minY < 0) {
            minY = 0;
        }
        if (maxY > panel.width) {
            maxY = panel.width;
        }
        if (maxX > panel.length) {
            maxX = panel.length;
        }
        if (minZ < 0) {
            minZ = 0;
        }
        if (maxZ > panel.thickness) {
            maxZ = panel.thickness;
        }

        if (cmpr(minZ, 0)) {
            this.side = VIYAR_BACK_SIDE;
        }
        if (cmpr(maxZ, panel.thickness)) {
            this.side = VIYAR_FRONT_SIDE;
        }
        if (this.subType == VIYAR_VERTICAL_CUT) {
            if (cmpr(minX, 0)) {
                this.edge = VIYAR_LEFT_SIDE;
            }
            if (cmpr(maxX, panel.length)) {
                this.edge = VIYAR_RIGHT_SIDE;
            }
        }
        if (this.subType == VIYAR_HORIZONTAL_CUT) {
            if (cmpr(minY, 0)) {
                this.edge = VIYAR_BOTTOM_SIDE;
            }
            if (cmpr(maxY, panel.width)) {
                this.edge = VIYAR_TOP_SIDE;
            }
        }
        var bottomButtThickness = findBottomButt(panel).thickness;
        var leftButtThickness = findLeftButt(panel).thickness;
        var topButtThickness = findTopButt(panel).thickness;
        var rightButtThickness = findRightButt(panel).thickness;
        if (((maxX - minX) > PRECISION) && ((maxY - minY) > PRECISION) && ((maxZ - minZ) > PRECISION)) {
            if (this.side == VIYAR_UNDEFINED) {
                if (this.edge != VIYAR_UNDEFINED) {
                    this.type = VIYAR_GROOVING;
                    this.side = this.edge;
                    this.width = maxZ - minZ;
                    if (this.subType == VIYAR_VERTICAL_CUT) {
                        this.x = panel.thickness - maxZ;
                        this.depth = maxX - minX;

                        var topCutClosed = false;
                        var bottomCutClosed = false;
                        if (cmpr(bottomButtThickness, minY) && (bottomButtThickness > PRECISION)) {
                            bottomCutClosed = true;
                        }
                        if (cmpr(panel.width, maxY + topButtThickness) && (topButtThickness > PRECISION)) {
                            topCutClosed = true;
                        }
                        if (bottomCutClosed) {
                            this.y = 0;
                        }
                        else {
                            this.y = minY;
                        }
                        if (topCutClosed && bottomCutClosed) {
                            this.length = panel.width;
                        }
                        else if (topCutClosed) {
                            this.length = panel.width - minY;
                        }
                        else if (bottomCutClosed) {
                            this.length = maxY;
                        }
                        else {
                            this.length = maxY - minY;
                        }
                        if (bottomCutClosed || topCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                    else if (this.subType == VIYAR_HORIZONTAL_CUT) {
                        this.y = panel.thickness - maxZ;
                        this.depth = maxY - minY;

                        var leftCutClosed = false;
                        var rightCutClosed = false;
                        if (cmpr(leftButtThickness, minX) && (leftButtThickness > PRECISION)) {
                            leftCutClosed = true;
                        }
                        if (cmpr(panel.length, maxX + rightButtThickness) && (rightButtThickness > PRECISION)) {
                            rightCutClosed = true;
                        }
                        if (leftCutClosed) {
                            this.x = 0;
                        }
                        else {
                            this.x = minX;
                        }
                        if (rightCutClosed && leftCutClosed) {
                            this.length = panel.length;
                        }
                        else if (rightCutClosed) {
                            this.length = panel.length - minX;
                        }
                        else if (leftCutClosed) {
                            this.length = maxX;
                        }
                        else {
                            this.length = maxX - minX;
                        }
                        if (rightCutClosed || leftCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                }
            }
            else {
                if (this.edge == VIYAR_UNDEFINED) {
                    this.type = VIYAR_GROOVING;
                    this.depth = maxZ - minZ;
                    if (this.subType == VIYAR_VERTICAL_CUT) {
                        this.x = minX;
                        this.width = maxX - minX;

                        var topCutClosed = false;
                        var bottomCutClosed = false;
                        if (cmpr(bottomButtThickness, minY) && (bottomButtThickness > PRECISION)) {
                            bottomCutClosed = true;
                        }
                        if (cmpr(panel.width, maxY + topButtThickness) && (topButtThickness > PRECISION)) {
                            topCutClosed = true;
                        }
                        if (bottomCutClosed) {
                            this.y = 0;
                        }
                        else {
                            this.y = minY;
                        }
                        if (topCutClosed && bottomCutClosed) {
                            this.length = panel.width;
                        }
                        else if (topCutClosed) {
                            this.length = panel.width - minY;
                        }
                        else if (bottomCutClosed) {
                            this.length = maxY;
                        }
                        else {
                            this.length = maxY - minY;
                        }
                        if (bottomCutClosed || topCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                    else if (this.subType == VIYAR_HORIZONTAL_CUT) {
                        this.y = minY;
                        this.width = maxY - minY;

                        var leftCutClosed = false;
                        var rightCutClosed = false;
                        if (cmpr(leftButtThickness, minX) && (leftButtThickness > PRECISION)) {
                            leftCutClosed = true;
                        }
                        if (cmpr(panel.length, maxX + rightButtThickness) && (rightButtThickness > PRECISION)) {
                            rightCutClosed = true;
                        }
                        if (leftCutClosed) {
                            this.x = 0;
                        }
                        else {
                            this.x = minX;
                        }
                        if (rightCutClosed && leftCutClosed) {
                            this.length = panel.length;
                        }
                        else if (rightCutClosed) {
                            this.length = panel.length - minX;
                        }
                        else if (leftCutClosed) {
                            this.length = maxX;
                        }
                        else {
                            this.length = maxX - minX;
                        }
                        if (rightCutClosed || leftCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                }
                else {
                    this.type = VIYAR_RABBETING;
                    this.depth = maxZ - minZ;
                    if (this.subType == VIYAR_VERTICAL_CUT) {
                        this.width = maxX - minX;

                        var topCutClosed = false;
                        var bottomCutClosed = false;
                        if (cmpr(bottomButtThickness, minY) && (bottomButtThickness > PRECISION)) {
                            bottomCutClosed = true;
                        }
                        if (cmpr(panel.width, maxY + topButtThickness) && (topButtThickness > PRECISION)) {
                            topCutClosed = true;
                        }
                        if (bottomCutClosed) {
                            this.shift = 0;
                        }
                        else {
                            this.shift = minY;
                        }
                        if (topCutClosed && bottomCutClosed) {
                            this.length = panel.width;
                        }
                        else if (topCutClosed) {
                            this.length = panel.width - minY;
                        }
                        else if (bottomCutClosed) {
                            this.length = maxY;
                        }
                        else {
                            this.length = maxY - minY;
                        }
                        if (bottomCutClosed || topCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                    else if (this.subType == VIYAR_HORIZONTAL_CUT) {
                        this.width = maxY - minY;

                        var leftCutClosed = false;
                        var rightCutClosed = false;
                        if (cmpr(leftButtThickness, minX) && (leftButtThickness > PRECISION)) {
                            leftCutClosed = true;
                        }
                        if (cmpr(panel.length, maxX + rightButtThickness) && (rightButtThickness > PRECISION)) {
                            rightCutClosed = true;
                        }
                        if (leftCutClosed) {
                            this.shift = 0;
                        }
                        else {
                            this.shift = minX;
                        }
                        if (rightCutClosed && leftCutClosed) {
                            this.length = panel.length;
                        }
                        else if (rightCutClosed) {
                            this.length = panel.length - minX;
                        }
                        else if (leftCutClosed) {
                            this.length = maxX;
                        }
                        else {
                            this.length = maxX - minX;
                        }
                        if (rightCutClosed || leftCutClosed) {
                            this.closed = 1;
                        }
                        else {
                            this.closed = 0;
                        }
                        this.isExist = true;
                    }
                }
            }
        }
    }
}

function findLeftButt(panel) {
    if (panel.rectangle) {
        if (panel.leftButt != undefined) {
            return panel.leftButt;
        }
    }
    else {
        var minX = findMinX(panel.contour);
        for (var i = 0; i < panel.contour.Count; i++) {
            var elem = panel.contour[i];
            if (elem.IsLine()) {
                if (cmpr(elem.Pos1.x, minX) && cmpr(elem.Pos2.x, minX)) {
                    return new Butt(elem);
                }
            }
        }
    }
    return new Butt();
}

function findBottomButt(panel) {
    if (panel.rectangle) {
        if (panel.bottomButt != undefined) {
            return panel.bottomButt;
        }
    }
    else {
        var minY = findMinY(panel.contour);
        for (var i = 0; i < panel.contour.Count; i++) {
            var elem = panel.contour[i];
            if (elem.IsLine()) {
                if (cmpr(elem.Pos1.y, minY) && cmpr(elem.Pos2.y, minY)) {
                    return new Butt(elem);
                }
            }
        }
    }
    return new Butt();
}

function findTopButt(panel) {
    if (panel.rectangle) {
        if (panel.topButt != undefined) {
            return panel.topButt;
        }
    }
    else {
        var maxY = findMaxY(panel.contour);
        for (var i = 0; i < panel.contour.Count; i++) {
            var elem = panel.contour[i];
            if (elem.IsLine()) {
                if (cmpr(elem.Pos1.y, maxY) && cmpr(elem.Pos2.y, maxY)) {
                    return new Butt(elem);
                }
            }
        }
    }
    return new Butt();
}

function findRightButt(panel) {
    if (panel.rectangle) {
        if (panel.rightButt != undefined) {
            return panel.rightButt;
        }
    }
    else {
        var maxX = findMaxX(panel.contour);
        for (var i = 0; i < panel.contour.Count; i++) {
            var elem = panel.contour[i];
            if (elem.IsLine()) {
                if (cmpr(elem.Pos1.x, maxX) && cmpr(elem.Pos2.x, maxX)) {
                    return new Butt(elem);
                }
            }
        }
    }
    return new Butt();
}

function isVertLine(line) {
    if (line.IsLine() && cmpr(line.Pos1.x, line.Pos2.x)) {
        return true;
    }
    return false;
}

function isHorLine(line) {
    if (line.IsLine() && cmpr(line.Pos1.y, line.Pos2.y)) {
        return true;
    }
    return false;
}

function isRightTriangle(contour) {
    var vert = false;
    var hor = false;
    var slant = false;

    if (contour.Count == 3) {
        if (contour.IsClosedContour()) {
            contour.OrderContours();
            for (var i = 0; i < contour.Count; i++) {
                if (contour[i].IsLine()) {
                    var line = contour[i];
                    if (isVertLine(line)) {
                        vert = true;
                    }
                    else if (isHorLine(line)) {
                        hor = true;
                    }
                    else {
                        slant = true;
                    }
                }
            }
            if (vert && hor && slant) {
                return true;
            }
        }
    }
    return false;
}

function isOrthoLine(trajectory) {
    if ((trajectory.Count == 1) && (trajectory[0].IsLine())) {
        var line = trajectory[0];
        if (isVertLine(line) || isHorLine(line)) {
            return true;
        }
    }
    return false;
}

function validateProject() {
    var arrArtPos = [];
    Model.forEachPanel(function (modelPanel) {
        if ((modelPanel != undefined) && (modelPanel != null) && (isAsmChild(modelPanel) == false) && (isDraftChild(modelPanel) == false) && (modelPanel.ArtPos != '')) {
            for (var i = 0; i < modelPanel.Contour.Count; i++) {
                if (modelPanel.Contour[i].ObjLength() == 0) {
                    modelPanel.Highlighted = true;
                    if (arrArtPos.some(function (item) { return item == modelPanel.ArtPos; }) == false) {
                        arrArtPos.push(modelPanel.ArtPos);
                    }
                }
            }
        }
    });
    arrArtPos.sort(function (a, b) { return a - b });
    if (arrArtPos.length > 0) {
        var strArtPos = '';
        strArtPos = arrArtPos[0];
        if (arrArtPos.length == 1) {
            strElem = 'Контур детали поз. ' + strArtPos + ' содержит элементы нулевой длины.';
        }
        else if (arrArtPos.length > 1) {
            for (i = 1; i < arrArtPos.length; i++) {
                strArtPos += ', ' + arrArtPos[i];
            }
            strElem = 'Контуры деталей поз. ' + strArtPos + ' содержат элементы нулевой длины.';
        }
        if (confirm(strElem + '\nУдалить элементы автоматически?')) {
            Model.forEachPanel(function (modelPanel) {
                if (modelPanel != undefined) {
                    for (var i = 0; i < modelPanel.Contour.Count; i++) {
                        if (modelPanel.Contour[i].ObjLength() == 0) {
                            StartEditing(modelPanel);
                            modelPanel.Contour.Delete(modelPanel.Contour[i]);
                            modelPanel.Contour.OrderContours();
                            modelPanel.Build();
                        }
                    }
                }
            });
            Model.UnHighlightAll();
            Action.Commit();
        } else {
            alert('Необходимо выполнить редактирование контура!');
            return false;
        }
    }
    var arrArtPos = [];
    Model.forEachPanel(function (modelPanel) {
        if ((modelPanel != undefined) && (modelPanel != null) && (isAsmChild(modelPanel) == false) && (isDraftChild(modelPanel) == false) && (modelPanel.ArtPos != '')) {
            for (var i = 0; i < modelPanel.Contour.Count; i++) {
                if (modelPanel.Contour[i].ObjLength() < 1.0) {
                    modelPanel.Highlighted = true;
                    if (arrArtPos.some(function (item) { return item == modelPanel.ArtPos; }) == false) {
                        arrArtPos.push(modelPanel.ArtPos);
                    }
                }
            }
        }
    });
    arrArtPos.sort(function (a, b) { return a - b });
    if (arrArtPos.length > 0) {
        var strArtPos = '';
        strArtPos = arrArtPos[0];
        if (arrArtPos.length == 1) {
            strElem = 'Контур детали поз. ' + strArtPos + ' содержит элементы длиной менее 1мм.';
        }
        else if (arrArtPos.length > 1) {
            for (i = 1; i < arrArtPos.length; i++) {
                strArtPos += ', ' + arrArtPos[i];
            }
            strElem = 'Контуры деталей поз. ' + strArtPos + ' содержат элементы длиной менее 1мм.';
        }
        alert(strElem + '\nНеобходимо выполнить редактирование контура!');
        return false;
    }
    var arrArtPos = [];
    Model.forEachPanel(function (modelPanel) {
        if ((modelPanel != undefined) && (modelPanel != null) && (isAsmChild(modelPanel) == false) && (isDraftChild(modelPanel) == false) && (modelPanel.ArtPos != '')) {
            if (modelPanel.Plastics.Count > 0) {
                modelPanel.Highlighted = true;
                if (arrArtPos.some(function (item) { return item == modelPanel.ArtPos; }) == false) {
                    arrArtPos.push(modelPanel.ArtPos);
                }
            }
        }
    });
    arrArtPos.sort(function (a, b) { return a - b });
    if (arrArtPos.length > 0) {
        var strArtPos = '';
        strArtPos = arrArtPos[0];
        if (arrArtPos.length == 1) {
            strElem = 'Пласть детали поз. ' + strArtPos + ' облицована материалом.\nДанная деталь не будет экспортирована.';
        }
        else if (arrArtPos.length > 1) {
            for (i = 1; i < arrArtPos.length; i++) {
                strArtPos += ', ' + arrArtPos[i];
            }
            strElem = 'Пласти деталей поз. ' + strArtPos + ' облицованы материалом.\nДанные детали не будут экспортированы.';
        }
        if (confirm(strElem + ' Продолжить?')) {
            return true;
        } else {
            alert('Необходимо удалить облицовку пласти!');
            return false;
        }
    }
    return true;
}

function checkManufactRule() {
    var arrArtPos = [];

    Model.forEachPanel(function (modelPanel) {
        if (modelPanel != undefined) {
            for (var i = 0; i < modelPanel.Butts.Count; i++) {
                var butt = modelPanel.Butts[i];
                if (butt != undefined) {
                    if (butt.Width < (modelPanel.Thickness + BUTT_WIDTH_MANUFACT_RULE)) {
                        modelPanel.Highlighted = true;
                        if (arrArtPos.some(function (item) { return item == modelPanel.ArtPos; }) == false) {
                            arrArtPos.push(modelPanel.ArtPos);
                        }
                    }
                }
            }
        }
    });
    arrArtPos.sort(function (a, b) { return a - b });
    if (arrArtPos.length == 1) {
        alert('Деталь поз. ' + arrArtPos[0] + ' облицована недопустимой по ширине кромкой. Ширина кромки должна быть на 3мм больше толщины детали.');
        return false;
    }
    else if (arrArtPos.length > 1) {
        var strArtPos = '';
        strArtPos = arrArtPos[0];
        for (iArtPos = 1; iArtPos < arrArtPos.length; iArtPos++) {
            strArtPos += ', ' + arrArtPos[iArtPos];
        }
        alert('Детали поз. ' + strArtPos + ' облицованы недопустимой по ширине кромкой. Ширина кромки должна быть на 3мм больше толщины детали.');
        return false;
    }
    return true;
}

function limitHolesDepth(panel) {
    panel.holes.forEach(function (hole) {
        if (hole.depth > MAX_HOLE_DEPTH) {
            hole.depth = MAX_HOLE_DEPTH;
        }
    });
}

function thruHolesToFace(panel) {
    panel.holes.forEach(function (hole) {
        if ((hole.dirZ == 1) && (hole.type == HOLE_THRU_TYPE)) {
            hole.dirZ = -1 * hole.dirZ;
            hole.posZ = panel.thickness - hole.posZ;
        }
    });
}

function calcDirXHoles(panel, dir, type) {
    var cntr = 0;
    panel.holes.forEach(function (hole) {
        if ((hole.dirX == dir) && (hole.type == type)) {
            cntr++;
        }
    });
    return cntr;
}

function calcDirYHoles(panel, dir, type) {
    var cntr = 0;
    panel.holes.forEach(function (hole) {
        if ((hole.dirY == dir) && (hole.type == type)) {
            cntr++;
        }
    });
    return cntr;
}

function calcDirZHoles(panel, dir, type) {
    var cntr = 0;
    panel.holes.forEach(function (hole) {
        if ((hole.dirZ == dir) && (hole.type == type)) {
            cntr++;
        }
    });
    return cntr;
}

function calcLeftLength(panel) {
    var length = 0;
    for (var i = 0; i < panel.orderedContour.Count; i++) {
        var elem = panel.orderedContour[i];
        if (elem.ElType == ELEM_LINE_TYPE) {
            if (cmpr(elem.Pos1.x, 0) && cmpr(elem.Pos2.x, 0)) {
                length += elem.ObjLength();
            }
        }
    }
    return length;
}

function calcTopLength(panel) {
    var length = 0;
    for (var i = 0; i < panel.orderedContour.Count; i++) {
        var elem = panel.orderedContour[i];
        if (elem.ElType == ELEM_LINE_TYPE) {
            if (cmpr(elem.Pos1.y, panel.width) && cmpr(elem.Pos2.y, panel.width)) {
                length += elem.ObjLength();
            }
        }
    }
    return length;
}

function calcRightLength(panel) {
    var length = 0;
    for (var i = 0; i < panel.orderedContour.Count; i++) {
        var elem = panel.orderedContour[i];
        if (elem.ElType == ELEM_LINE_TYPE) {
            if (cmpr(elem.Pos1.x, panel.length) && cmpr(elem.Pos2.x, panel.length)) {
                length += elem.ObjLength();
            }
        }
    }
    return length;
}

function calcBottomLength(panel) {
    var length = 0;
    for (var i = 0; i < panel.orderedContour.Count; i++) {
        var elem = panel.orderedContour[i];
        if (elem.ElType == ELEM_LINE_TYPE) {
            if (cmpr(elem.Pos1.y, 0) && cmpr(elem.Pos2.y, 0)) {
                length += elem.ObjLength();
            }
        }
    }
    return length;
}

function rotate180(panel) {
    var rightButt = panel.leftButt;
    var bottomButt = panel.topButt;
    var leftButt = panel.rightButt;
    var topButt = panel.bottomButt;
    panel.rightButt = rightButt;
    panel.bottomButt = bottomButt;
    panel.leftButt = leftButt;
    panel.topButt = topButt;

    var length = panel.length;
    var width = panel.width;

    panel.holes.forEach(function (hole) {
        hole.dirX = -1 * hole.dirX;
        hole.dirY = -1 * hole.dirY;
        hole.posX = length - hole.posX;
        hole.posY = width - hole.posY;
    });

    panel.orderedContour.Rotate(0, 0, -180.0);
    panel.contour.Rotate(0, 0, -180.0);
    var minX = findMinX(panel.orderedContour);
    var minY = findMinY(panel.orderedContour);
    panel.orderedContour.Move(minX * -1.0, minY * -1.0);
    panel.contour.Move(minX * -1.0, minY * -1.0);

    panel.cuts.forEach(function (cut) {
        cut.trajectory.Rotate(0, 0, -180.0);
        cut.trajectory.Move(minX * -1.0, minY * -1.0);
    });
}

function rotate90(panel) {
    var rightButt = panel.topButt;
    var bottomButt = panel.rightButt;
    var leftButt = panel.bottomButt;
    var topButt = panel.leftButt;
    panel.rightButt = rightButt;
    panel.bottomButt = bottomButt;
    panel.leftButt = leftButt;
    panel.topButt = topButt;

    var length = panel.length;
    var width = panel.width;

    panel.holes.forEach(function (hole) {
        var dirX = hole.dirY;
        var dirY = -1 * hole.dirX;
        hole.dirX = dirX;
        hole.dirY = dirY;

        var posX = hole.posY;
        var posY = length - hole.posX;
        hole.posX = posX;
        hole.posY = posY;
    });

    panel.orderedContour.Rotate(0, 0, -90.0);
    panel.contour.Rotate(0, 0, -90.0);
    var minX = findMinX(panel.orderedContour);
    var minY = findMinY(panel.orderedContour);
    panel.orderedContour.Move(minX * -1.0, minY * -1.0);
    panel.contour.Move(minX * -1.0, minY * -1.0);

    panel.cuts.forEach(function (cut) {
        cut.trajectory.Rotate(0, 0, -90.0);
        cut.trajectory.Move(minX * -1.0, minY * -1.0);
    });

    panel.width = length;
    panel.length = width;

    if (panel.texture == PANEL_TEXTURE_VERTICAL) {
        panel.texture = PANEL_TEXTURE_HORIZONTAL;
    }
    else if (panel.texture == PANEL_TEXTURE_HORIZONTAL) {
        panel.texture = PANEL_TEXTURE_VERTICAL;
    }
}

function flipY(panel) {
    var rightButt = panel.leftButt;
    var leftButt = panel.rightButt;
    panel.rightButt = rightButt;
    panel.leftButt = leftButt;

    var length = panel.length;

    panel.holes.forEach(function (hole) {
        hole.dirX = -1 * hole.dirX;
        hole.dirZ = -1 * hole.dirZ;
        hole.posX = length - hole.posX;
        hole.posZ = panel.thickness - hole.posZ;
    });
    if (panel.face == PANEL_FACE_SIDE_1) {
        panel.face = PANEL_FACE_SIDE_2;
    }
    else if (panel.face == PANEL_FACE_SIDE_2) {
        panel.face = PANEL_FACE_SIDE_1;
    }
    panel.orderedContour.Symmetry(0, 0, 0, panel.width, false);
    panel.contour.Symmetry(0, 0, 0, panel.width, false);
    var minX = findMinX(panel.orderedContour);
    var minY = findMinY(panel.orderedContour);
    panel.orderedContour.Move(minX * -1.0, minY * -1.0);
    panel.contour.Move(minX * -1.0, minY * -1.0);

    panel.cuts.forEach(function (cut) {
        cut.trajectory.Symmetry(0, 0, 0, panel.width, false);
        cut.trajectory.Move(minX * -1.0, minY * -1.0);
        cut.profile.Rotate(0, 0, -180.0);
        cut.profile.Move(0, panel.thickness);
        cut.depth = cut.depth * -1.0;
    });
}

function findContours(contour) {
    var contourCopy = NewContour();
    contourCopy.AddList(contour.MakeCopy());

    var result = [];
    var closedContour = NewContour();
    while (contourCopy.FindContour(closedContour, true)) {
        closedContour.OrderContours();
        if (closedContour.IsClosedContour() && !closedContour.IsClockOtherWise()) {
            closedContour.InvertDirection();
        }
        result.push(closedContour);
        closedContour = NewContour();
    }
    result.sort(function (a, b) {
        if (isInContour(a, b)) { return 1; }
        if (isInContour(b, a)) { return -1; }
        return 0;
    });
    for (var i = 0; i < result.length; i++) {
        if (!result[i].IsClosedContour()) {
            result.length = 0;
            return result;
        }
    }
    for (var i = 1; i < result.length; i++) {
        if (!isInContour(result[i], result[0])) {
            result.length = 0;
            return result;
        }
    }
    return result;
}

function isInContour(inCont, outCont) {
    if (system.apiVersion < 1000) {
        if ((inCont.Count > 0) && (outCont.Count > 0)) {
            for (var i = 0; i < inCont.Count; i++) {
                var elem = inCont[i];
                if (elem.IsArc() || elem.IsLine()) {
                    if ((outCont.IsPointInside(elem.Pos1) == false) || (outCont.IsPointInside(elem.Pos2) == false)) {
                        return false;
                    }
                }
                else if (elem.IsCircle()) {
                    if ((outCont.IsPointInside(NewPoint(elem.Center.x + elem.CirRadius, elem.Center.y)) == false) ||
                        (outCont.IsPointInside(NewPoint(elem.Center.x - elem.CirRadius, elem.Center.y)) == false) ||
                        (outCont.IsPointInside(NewPoint(elem.Center.x, elem.Center.y + elem.CirRadius)) == false) ||
                        (outCont.IsPointInside(NewPoint(elem.Center.x, elem.Center.y - elem.CirRadius)) == false)) {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return inCont.IsInContour(outCont);
    }
}

function adjustOrientation(panel) {
    if (panel.texture == PANEL_TEXTURE_VERTICAL) {
        rotate90(panel);
    }
    else if ((panel.texture == PANEL_TEXTURE_UNDEFINED) && (panel.width > panel.length)) {
        rotate90(panel);
    }
    if (panel.face == PANEL_FACE_SIDE_2) {
        flipY(panel);
    }
    else if ((panel.face == PANEL_FACE_UNDEFINED) && (calcDirZHoles(panel, -1, HOLE_BLIND_TYPE) > calcDirZHoles(panel, 1, HOLE_BLIND_TYPE))) {
        flipY(panel);
    }
    else if ((panel.face == PANEL_FACE_UNDEFINED) && (calcDirZHoles(panel, 1, HOLE_THRU_TYPE) > calcDirZHoles(panel, -1, HOLE_THRU_TYPE)) &&
        (calcDirZHoles(panel, -1, HOLE_BLIND_TYPE) == calcDirZHoles(panel, 1, HOLE_BLIND_TYPE))) {
        flipY(panel);
    }
    if (panel.rectangle) {
        if ((panel.topButt != undefined) && (panel.bottomButt == undefined)) {
            rotate180(panel);
        }
    }
    else {
        var topLength = calcTopLength(panel);
        var bottomLength = calcBottomLength(panel);
        var leftLength = calcLeftLength(panel);
        var rightLength = calcRightLength(panel);
        if (!cmpr(bottomLength, topLength) && (bottomLength < topLength) && !cmpr(leftLength, rightLength) && (leftLength < rightLength)) {
            rotate180(panel);
        }
        else if (!cmpr(bottomLength, topLength) && (bottomLength < topLength) && cmpr(leftLength, rightLength)) {
            rotate180(panel);
        }
        else if (cmpr(bottomLength, topLength) && !cmpr(leftLength, rightLength) && (leftLength < rightLength)) {
            rotate180(panel);
        }
        else if (!cmpr(bottomLength, topLength) && (bottomLength < topLength) && !cmpr(leftLength, rightLength) && (leftLength > rightLength)) {
            rotate180(panel);
            flipY(panel);
        }
        else if (!cmpr(bottomLength, topLength) && (bottomLength > topLength) && !cmpr(leftLength, rightLength) && (leftLength < rightLength)) {
            flipY(panel);
        }
    }
}

function sawingSize(panel) {
    if (panel.rectangle) {
        var leftButt = 0;
        var rightButt = 0;
        var topButt = 0;
        var bottomButt = 0;

        if (panel.leftButt != undefined) {
            leftButt = panel.leftButt.thickness;
        }
        if (panel.rightButt != undefined) {
            rightButt = panel.rightButt.thickness;
        }
        if (panel.topButt != undefined) {
            topButt = panel.topButt.thickness;
        }
        if (panel.bottomButt != undefined) {
            bottomButt = panel.bottomButt.thickness;
        }
        return {
            length: panel.length - leftButt - rightButt,
            width: panel.width - topButt - bottomButt
        };
    }
    else {
        var contours = findContours(panel.contour);
        if (contours.length > 0) {
            var sawingContour = findSawingContour(contours[0]);
            /*Obj = AddPanel(300, 300);
            cont = Obj.Contour;
            Undo.Changing(Obj);
            cont.Clear();
            cont.AddList(sawingContour.MakeCopy());
            var minX = findMinX(cont);
            var minY = findMinY(cont);
            cont.Move(minX * -1.0, minY * -1.0);
            Obj.Build();*/
            if ((sawingContour != null) && (sawingContour.IsClosedContour())) {
                var minX = findMinX(sawingContour);
                var minY = findMinY(sawingContour);
                var maxX = findMaxX(sawingContour);
                var maxY = findMaxY(sawingContour);
                return {
                    length: maxX - minX,
                    width: maxY - minY
                };
            }
            else {
                return undefined;
            }
        }
        else {
            return undefined;
        }
    }
}

function findSawingContour(contour) {
    var sawingContour = NewContour();
    for (var i = 0; i < contour.Count; i++) {
        var elem = contour[i];
        if (elem.ElType == ELEM_CIRCLE_TYPE) {
            var butt = new Butt(elem);
            radius = elem.CirRadius - butt.thickness;
            sawingContour.AddCircle(elem.Center.x, elem.Center.y, radius);
            return sawingContour;
        }
        else {
            prev = contour[prevIndex(contour, i)];
            next = contour[nextIndex(contour, i)];
            if ((distance(prev.Pos2, elem.Pos1) < 0.01) && (distance(elem.Pos2, next.Pos1) < 0.01)) {
                var vert1 = vertex(prev, elem);
                var vert2 = vertex(elem, next);
                if ((vert1 != null) && (vert2 != null)) {
                    if (elem.ElType == ELEM_LINE_TYPE) {
                        sawingContour.AddLine(vert1.x, vert1.y, vert2.x, vert2.y);
                    }
                    else if (elem.ElType == ELEM_ARC_TYPE) {
                        var p1 = NewPoint(vert1.x, vert1.y);
                        var p2 = NewPoint(vert2.x, vert2.y);
                        sawingContour.AddArc(p1, p2, elem.Center, elem.ArcDir);
                        //sawingContour.AddLine(vert1.x, vert1.y, vert2.x, vert2.y);
                    }
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        }
    }
    return sawingContour;
}

function prevIndex(contour, index) {
    if (contour.Count > 0) {
        if (index > 0) {
            return index - 1;
        }
        else {
            return contour.Count - 1;
        }
    }
    return 0;
}

function nextIndex(contour, index) {
    if (contour.Count > 0) {
        if (index < (contour.Count - 1)) {
            return index + 1;
        }
    }
    return 0;
}

function distance(p1, p2) {
    var a = p1.x - p2.x;
    var b = p1.y - p2.y;
    var dist = Math.sqrt(a * a + b * b);
    return dist;
}

function perpendicular(p1, p2, d, dir) {
    dx = p1.x - p2.x;
    dy = p1.y - p2.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    dx /= dist;
    dy /= dist;

    if (dir) {
        return {
            x: p1.x - d * dy,
            y: p1.y + d * dx
        };
    }
    return {
        x: p1.x + d * dy,
        y: p1.y - d * dx
    };
}

function parallel(p1, p2, d, dir) {
    dx = p2.x - p1.x;
    dy = p2.y - p1.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    dx /= dist;
    dy /= dist;

    if (dir) {
        var p3 = {
            x: p1.x + d * dy,
            y: p1.y - d * dx
        };
        var p4 = {
            x: p2.x + d * dy,
            y: p2.y - d * dx
        };
    }
    else {
        var p3 = {
            x: p1.x - d * dy,
            y: p1.y + d * dx
        };
        var p4 = {
            x: p2.x - d * dy,
            y: p2.y + d * dx
        };
    }
    return [p3, p4];
}

function intersect(p1, p2, p3, p4) {
    if ((p1.x == p2.x && p1.y == p2.y) || (p3.x == p4.x && p3.y == p4.y)) {
        return null;
    }
    var denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    if (Math.abs(denom) < 1) {
        return null;
    }
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
    };
}

function vertex(elem1, elem2) {
    var offset1 = 0;
    var end1 = { x: elem1.Pos2.x, y: elem1.Pos2.y };
    if (elem1.ElType == ELEM_LINE_TYPE) {
        var start1 = { x: elem1.Pos1.x, y: elem1.Pos1.y };
        butt1 = new Butt(elem1);
        if (butt1.isExist && butt1.clip) {
            offset1 = butt1.thickness;
            arr = parallel(start1, end1, offset1, true);
            start1 = arr[0];
            end1 = arr[1];
        }
    }
    else if (elem1.ElType == ELEM_ARC_TYPE) {
        var center = { x: elem1.Center.x, y: elem1.Center.y };
        var dist = elem1.ArcRadius();
        var dir = !elem1.ArcDir;
        var start1 = perpendicular(end1, center, dist, dir);
        butt1 = new Butt(elem1);
        if (butt1.isExist && butt1.clip) {
            offset1 = butt1.thickness;
            arr = parallel(start1, end1, offset1, true);
            start1 = arr[0];
            end1 = arr[1];
        }
    }
    var offset2 = 0;
    var start2 = { x: elem2.Pos1.x, y: elem2.Pos1.y };
    if (elem2.ElType == ELEM_LINE_TYPE) {
        var end2 = { x: elem2.Pos2.x, y: elem2.Pos2.y };
        butt2 = new Butt(elem2);
        if (butt2.isExist && butt2.clip) {
            offset2 = butt2.thickness;
            arr = parallel(start2, end2, offset2, true);
            start2 = arr[0];
            end2 = arr[1];
        }
    }
    else if (elem2.ElType == ELEM_ARC_TYPE) {
        var center = { x: elem2.Center.x, y: elem2.Center.y };
        var dist = elem2.ArcRadius();
        var dir = elem2.ArcDir;
        var end2 = perpendicular(start2, center, dist, dir);
        butt2 = new Butt(elem2);
        if (butt2.isExist && butt2.clip) {
            offset2 = butt2.thickness;
            arr = parallel(start2, end2, offset2, true);
            start2 = arr[0];
            end2 = arr[1];
        }
    }
    if (distance(end1, start2) < 0.01) {
        var vert = end1;
    }
    else {
        var offset = Math.sqrt(offset1 * offset1 + offset2 * offset2) * 2.0;
        var junc = { x: elem1.Pos2.x, y: elem1.Pos2.y };
        var vert = intersect(start1, end1, start2, end2);
        if ((vert != null) && (distance(junc, vert) > offset)) {
            vert = null;
        }
    }
    return vert;
}

