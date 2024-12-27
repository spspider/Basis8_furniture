var DEBUG = false;
const PROGRAM_NAME = 'БазисСкрипт';
const SCRIPT_VERSION = '5.3';
const PROPERTIES_FILE = 'Экспорт проекта ViyarPro.xml';
const VIYAR_PRO_PROJECT_FILE = 'Файл проекта ViyarPro: ';

const PANEL_FACE_SIDE_1 = 0;
const PANEL_FACE_SIDE_2 = 1;
const PANEL_FACE_UNDEFINED = 2;

var panels = [];
var materials = [];

panels.add = function (panel) {
    this.push(panel);
};

function Material(name, code, thickness) {
    this.name = name;
    this.code = code;
    this.thickness = thickness;
}

panels.forEachPanel = function (callback) {
    this.forEach(panel => {
        callback(panel);
    });
};

// Dummy function for mimicking GUI properties interactions
var Action = {
    Properties: {
        NewString: (label, value) => ({ label, value }),
        NewCombo: (label, items) => ({ label, items }),
        NewBool: (label) => ({ label }),
        NewSelector: (label) => ({ label }),
        NewButton: (label) => ({ label })
    },
    Hint: "",
    Finish: () => console.log("Export finished."),
    Continue: () => console.log("Continue action.")
};

// Mimicking external system interactions
const system = {
    fileExists: (filename) => true,
    askFileNameSave: (defaultName) => "output.csv",
    writeTextFile: (filename, content) => console.log(`Writing to ${filename}: ${content}`)
};

function exportViyarPro() {
    const filename = "export.csv";
    const csvContent = exportCSV(panels);
    system.writeTextFile(filename, csvContent);
    Action.Finish();
}

function exportCSV(panels) {
    var csvRows = ["ID;Material;Name;Thickness;Width;Height;Quantity"];
    panels.forEach((panel, index) => {
        const row = [
            index + 1,
            panel.material.name,
            panel.name,
            panel.thickness,
            panel.length,
            panel.width,
            panel.quantity
        ].join(";");
        csvRows.push(row);
    });
    return csvRows.join("\n");
}

// Mock setup UI
function setupUI() {
    var prop = Action.Properties;
    var materialCombo = prop.NewCombo('Материал деталей', ['Material1', 'Material2']);
    var exportBtn = prop.NewButton('Экспортировать');
    exportBtn.onClick = exportViyarPro;
    Action.Continue();
}

// simulate UI setup
setupUI();
