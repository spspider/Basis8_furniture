var
  csvRows = [];

Model.forEachPanel(
  function(Obj){
    var Line = [];
    Line.push(Obj.Name);
    Line.push(Obj.ArtPos);
    Line.push(Obj.ContourWidth);
    Line.push(Obj.ContourHeight);
    Butt = '��� ������';
    if (Obj.Butts && (Obj.Butts.Count))
    Butt = Obj.Butts.Count + ' ������';
    Line.push(Butt);
    csvRows.push(Line.join(';'));
});

alert(csvRows.join('\n'));
