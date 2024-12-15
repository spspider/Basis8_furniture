
var DEBUG = false;
const SCRIPT_VERSION = '5.3';
const OBJ_TREE_FILE_NAME = 'ObjTree.js';
const PROPERTIES_FILE = 'Экспорт проекта ViyarPro.xml';
const VIYAR_PRO_PROJECT_FILE = 'Файл проекта ViyarPro: ';

const POSITION_NAME_FORMAT = 'Позиция.Наименование';
const DESIGNATION_NAME_FORMAT = 'Обозначение.Наименование';
const ORDER_POSITION_NAME_FORMAT = 'Заказ.Позиция.Наименование';
const ORDER_DESIGNATION_NAME_FORMAT = 'Заказ.Обозначение.Наименование';
const NAME_FORMAT = 'Наименование';


const PRECISION = 0.1;
const VIYAR_MINIMUM_RADIUS = 3.0;



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
    var arr = [nameCode, ''];
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

