//��������� 3 ������ �� ������ � ���� ������
//������ p1 ����� p2 ����������
Otstup = 40;
Diam = 200;
Rad = 30;
p1 = GetPoint('������� ������ �����');
p2 = GetPoint('������� ������ �����');
//���� ������� �� ���� �������, �� ���������� z ����� ���������
//������������� ����������� ���������� z ������ �������� ���������� �����
if (p1.z == p2.z) p2.z = Model.GMax.z

//���� ������� ����� � ������������ �������, �� ������ ����������
if (p1.z > p2.z)
  {
    rrr = p1.z;
    p1.z = p2.z;
    p2.z = rrr;
  }
if (p1.y > p2.y)
  {
    rrr = p1.y;
    p1.y = p2.y;
    p2.y = rrr;
  }
if (p1.x > p2.x)
  {
    rrr = p1.x;
    p1.x = p2.x;
    p2.x = rrr;
  }

//��������� ������� �������� ���������
Thick = ActiveMaterial.Thickness;

Panel = AddVertPanel(p1.z, p1.y, p2.z, p2.y, p1.x);
//��������� ���������� � ������� ������
Panel.Contour.AddCircle((p2.z - p1.z) / 2, (p2.y - p1.y) / 2, Diam / 2);

Panel = AddHorizPanel(p1.x + Thick, p1.z, p2.x, p2.z, p1.y);
//��������� ������������� � ������� ������
Panel.Contour.AddRectangle(Otstup, -Otstup, p2.x - p1.x - Thick - Otstup, -(p2.z - p1.z - Otstup));

Panel = AddFrontPanel(p1.x + Thick, p1.y + Thick, p2.x, p2.y, p1.z);
//��������� ������������� �� ������������ � ������� ������
Panel.Contour.AddRoundRect(Otstup, Otstup, p2.x - p1.x - Thick - Otstup, p2.y - p1.y - Thick - Otstup, Rad);