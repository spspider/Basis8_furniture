//��������� 3 ������ �� ������ � ���� ������
//������ p1 ����� p2 ���������� z = ���������� z ����� p1
p1 = GetPoint('������� ������ �����');
p2 = GetPoint('������� ������ �����');
//���� ������� �� ���� �������, �� ���������� z ����� ���������
//������������� ����������� ���������� z ������ �������� ���������� �����
if (p1.z == p2.z) p2.z = Model.GMax.z
Thick = ActiveMaterial.Thickness; //��������� ������� �������� ���������
AddVertPanel(p1.z, p1.y, p2.z, p2.y, p1.x);
AddHorizPanel(p1.x + Thick, p1.z, p2.x, p2.z, p1.y);
AddFrontPanel(p1.x + Thick, p1.y + Thick, p2.x, p2.y, p1.z);