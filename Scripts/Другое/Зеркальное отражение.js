// �������� ������ � ������
P = AddPanel(100, 200);
P.Contour.Facet(0, 0, 40);
// ������� ������ ������������ ����� (150, 0, 0) ����� ��� �
newP = AddSymmetry(P, NewVector(150, 0, 0), AxisX);