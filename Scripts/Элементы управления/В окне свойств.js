Prop = Action.Properties;
Gsize = Prop.NewGroup('�������');
Pw = Gsize.NewNumber('��������', 300);
Ph = Gsize.NewNumber('��������', 200);

Schange = Gsize.NewButton('������..');
p1 = NewVector(0, 0, 0);
Schange.OnClick = function() {
    Action.AsyncExec(function() {
      Gsize.Enabled = false;
      p1 = GetPoint("������� ����� 1");
      p2 = GetPoint("������� ����� 2");
      Pw.Value = Math.abs(p1.x - p2.x);
      Ph.Value = Math.abs(p1.y - p2.y);
      Gsize.Enabled = true;
    })
};

GMat = Prop.NewGroup('��������');
Mat = GMat.NewMaterial('��������');
Butt = GMat.NewButt('��������');

Prop.OnChange = function() {
  DeleteNewObjects();
  Mat.SetActive();
  p = AddFrontPanel(p1.x, p1.y, p1.x + Pw.Value, p1.y + Ph.Value, p1.z);
  p.AddButt(Butt, 0);
  p.Build();
}

Prop.OnChange();

Prop.NewButton('����������').OnClick = function() {
  Action.Commit();
}


Action.Continue();