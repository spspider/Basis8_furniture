// ��������� ����� � ������
ShelfCount = NewNumberInput('���������� �����');
ShelfCount.Value = 4;

SetCamera(p3dFront);
LeftPanel = GetPanel('������� ����� ������');
RightPanel = GetPanel('������� ������ ������');
Left = LeftPanel.GabMax.x;
Right = RightPanel.GabMin.x;
Top = GetEdge('������� ������� �������', AxisX).First.y;
Bottom = GetEdge('������� ������ �������', AxisX).First.y;

SetCamera(p3dLeft);
Back = GetEdge('������� ������ �������', AxisY).First.z;
Front = GetEdge('������� �������� �������', AxisY).First.z;

OffsetLR = 0;
OffsetBF = 2;
Count = ShelfCount.Value;
Thick = ActiveMaterial.Thickness;

PosY = Bottom;
SectionHeight = Top - Bottom;
YInc = (SectionHeight - Count * Thick) / (Count + 1);

LCorner = OpenFurniture('�����\\������.f3d');

for (var k = 0; k < Count; k++) {
    PosY += YInc;
    Panel = AddHorizPanel(Left + OffsetLR, Back + OffsetBF, Right - OffsetLR,
        Front - OffsetBF, PosY);
    LCorner.Mount(Panel, LeftPanel, Left, PosY, Back + 32);
    LCorner.Mount(Panel, RightPanel, Right, PosY, Back + 32);
    LCorner.Mount(Panel, LeftPanel, Left, PosY, Front - 32);
    LCorner.Mount(Panel, RightPanel, Right, PosY, Front - 32);
    PosY += Thick;
}
SetCamera(p3dFront);