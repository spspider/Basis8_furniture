// ������ ���������� ������
Obj = Model.Selected;
// ��������, �������� �� �� �������
if (Obj)
  Obj = Obj.AsPanel;
if (!Obj)
  Obj = GetPanel("������� ������");
if (Obj) {
    // ������, ��� ���� ������ ����� ���������������
    StartEditing(Obj);
    p = GetPoint('������� ����� ���������');
    p = Obj.ToObject(p);
    // ��������� ����� � ������� ��������� ������� ������
    Hole = NewContour();
    Hole.AddCircle(p.x, p.y, 10);
    Obj.Contour.Subtraction(Hole);
    Obj.Build();
};