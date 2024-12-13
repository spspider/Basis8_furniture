var csvRows = [];
var selectedMaterial; // Variable to store the selected material

function Recurse(List) {
    for (var i = 0; i < List.Count; i++) {
        var Obj = List[i];
        if (Obj.List)
            Recurse(Obj)
        else {
            // Check if the object's material matches the selected material
            if (Obj.MaterialName === selectedMaterial || selectedMaterial === 'All') {
                var Line = [];
                Line.push(Obj.Name);
                Line.push(Obj.ArtPos);
                Line.push(Obj.GSize.x);
                Line.push(Obj.GSize.y);
                Line.push(Obj.GSize.z);
                var Butt = getButtInfo(Obj);
                Line.push(Butt);
                csvRows.push(Line.join(';'));
            }
        }
    }
}

function getButtInfo(Obj) {
    if (Obj.Butts && (Obj.Butts.Count)) {
        var buttInfo = [];
        for (var i = 0; i < Obj.Butts.Count; i++) {
            var butt = Obj.Butts[i];
            // Add butt information based on the thickness
            if (butt.Thickness === 2) {
                buttInfo.push('1');
            } else if (butt.Thickness === 0.4) {
                buttInfo.push('2');
            } else if (butt.Thickness === 0.8) {
                buttInfo.push('3');
            }
        }
        return buttInfo.join(', ');
    }
    return 'No edge banding'; // Default value if no butts are present
}

// Function to start the export process
function exportCSV() {
    var materialsList = 'All\n' + materials.join('\n'); // Add 'All' option to materials list
    var prop = Action.Properties;
    var materialCombo = prop.NewCombo('Материал деталей', materialsList);
    var exportBtn = prop.NewButton('Экспортировать');

    exportBtn.OnClick = function() {
        selectedMaterial = materialCombo.Value; // Get the selected material
        csvRows = []; // Clear previous CSV rows
        Recurse(Model); // Start the recursion to build CSV rows
        var csvContent = csvRows.join('\n');
        var fileName = system.askFileNameSave('csv', 'export.csv'); // Ask user for file name and location
        if (fileName) {
            system.writeTextFile(fileName, csvContent); // Write the CSV content to the file
            alert('Exported to CSV file: ' + fileName);
        } else {
            alert('Export cancelled.');
        }
    };

    prop.Run(); // Run the properties dialog to show the combo box and the export button
}

// Call the export function
exportCSV();