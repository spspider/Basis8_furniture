FileOptions = 'eksport-vision.prop';

Prop = Action.Properties;
Btn = Prop.NewButton('eksport')

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

//getting materials
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
        console.log(modelPanel);
        materials.add(new Material(modelPanel.MaterialName, modelPanel.Thickness));
    }
});
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

    // Create a new Combo property for material selection
    var materialCombo = prop.NewCombo('Материал деталей', materialsList);
}


Action.Properties.Load(FileOptions);
Action.OnFinish = function () {
    Action.Properties.Save(FileOptions);
}

var
    csvRows = [];

function Recurse(List) {
    for (var i = 0; i < List.Count; i++) {
        Obj = List[i];
        if (Obj.List)
            Recurse(Obj)
        else {
            var Line = [];
            Line.push(Obj.Name);
            Line.push(Obj.ArtPos);
            Line.push(Obj.GSize.x);
            Line.push(Obj.GSize.y);
            Line.push(Obj.GSize.z);
            Butt = '��� ������';
            if (Obj.Butts && (Obj.Butts.Count))
                Butt = Obj.Butts.Count + ' ������';
            Line.push(Butt);
            csvRows.push(Line.join(';'));
        }
    }
}
Action.Continue();
// Recurse(Model);