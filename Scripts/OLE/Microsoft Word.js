Word = NewCOMObject('Word.Application');
y = Word.Documents;
z = y.Add();
Word.Visible = true;
Word.Selection.TypeText('Bazis\n');
Action.Continue();

NewButtonInput("���������").OnChange = function() {
    Action.Finish();
}

NewButtonInput("�������� ������").OnChange = function() {
    Model.forEachPanel(
        function(Obj) {
            var Line = [];
            Line.push(Obj.Name);
            Line.push(Obj.ArtPos);
            Line.push(Obj.ContourWidth);
            Line.push(Obj.ContourHeight);
            Butt = '��� ������';
            if (Obj.Butts && (Obj.Butts.Count))
                Butt = Obj.Butts.Count + ' ������';
            Line.push(Butt);
            Word.Selection.TypeText(Line.join(';') + '\n');
        });
}

Action.OnFinish = function() {
    Word.Quit(false);
}