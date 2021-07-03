// ������� ����� �����
SideMat = NewMaterialInput('��������');
DepthVal = NewFloatInput('�������');
DepthVal.Value = Model.GSize.z;
ShelfMat = NewMaterialInput('�����');
ShelfCount = NewNumberInput('����������');
ShelfCount.Value = 5;
ShelfOffset = NewNumberInput('������');
ShelfOffset.Value = 2;
ShelfFast = NewFurnitureInput('�����');

// ������ ��������� ����
Left = GetEdge('������� ����� �������', AxisY).First.x;
Right = GetEdge('������� ������ �������', AxisY).First.x;
Top = GetEdge('������� ������� �������', AxisX).First.y;
Bottom = GetEdge('������� ������ �������', AxisX).First.y;

MakeShelf();
OkBtn = NewButtonInput('���������');
Action.Continue(); // �� ���������  ��������

function MakeShelf() {
    DeleteNewObjects(); // ������� ������ ��������� � ���� �������
    Depth = DepthVal.Value;
    Offset = ShelfOffset.Value;
    Count = ShelfCount.Value;
    SideMat.SetActive(); // ������� �������� �� ��������� ��������� � SideMat
    LeftPanel = AddVertPanel(0, Bottom, Depth, Top, Left);
    RightPanel = AddVertPanel(0, Bottom, Depth, Top, Right - SideMat.Thickness);

    PosY = Bottom;
    SectionHeight = Top - Bottom;
    YInc = (SectionHeight - Count * ShelfMat.Thickness) / (Count + 1);

    ShLeft = Left + SideMat.Thickness + Offset;
    ShRight = Right - SideMat.Thickness - Offset;

    ShelfMat.SetActive(); // ������� ����� �� ��������� ��������� � ShelfMat
    BeginBlock("�����");
    for (var k = 0; k < Count; k++) {
        PosY += YInc;
        Panel = AddHorizPanel(ShLeft, 0, ShRight, Depth, PosY);
        // ��������� ����� �������� ��������� � ShelfFast �� ���������
        ShelfFast.Mount(Panel, LeftPanel, ShLeft, PosY, 32);
        ShelfFast.Mount(Panel, RightPanel, ShRight, PosY, 32);
        ShelfFast.Mount(Panel, LeftPanel, ShLeft, PosY, Depth - 32);
        ShelfFast.Mount(Panel, RightPanel, ShRight, PosY, Depth - 32);
        PosY += ShelfMat.Thickness;
    }
    EndBlock();
}

function $input(id) {
    MakeShelf();
    if (id == OkBtn.id)
        return true; // �������� ������� ����������
}