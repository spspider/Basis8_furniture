Ext = AddExtrusion('name');
if (Ext.MaterialWidth == 0) {
    // ��������� ������ ��������� �������, ����� �� �� ����� ���������� � �����
    Ext.MaterialWidth = 100;
}
// ������������� �������
Ext.Contour.AddRectangle(0, 0, -50, 100);
// ������� ������� ����� ��� X
Ext.Orient(AxisX, AxisY);
// ��������� ����� �������
Ext.Thickness = 250;