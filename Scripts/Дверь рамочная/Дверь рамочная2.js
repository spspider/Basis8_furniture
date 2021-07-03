SetCamera(p3dFront);
Ofset = NewNumberInput("����� ��� �����")
Ofset.Value = 2;

Left = GetEdge("������� ����� �������", AxisY).First.x;
Right = GetEdge("������� ������ �������", AxisY).First.x;
Top = GetEdge("������� ������� �������", AxisX).First.y;
Bottom = GetEdge("������� ������ �������", AxisX).First.y;

if (Left > Right)
{
    AAA = Left;
    Left = Right;
    Right = AAA;
}
if (Bottom > Top)
{
    AAA = Bottom;
    Bottom = Top;
    Top = AAA;
}

WidthNishe = Right - Left;
DvX1 = Left + Ofset.Value;
DvY1 = Bottom + Ofset.Value;
DvX2 = Right - Ofset.Value;
DvY2 = Top - Ofset.Value;
DvXW = (WidthNishe / 2) + Left;
DvX3 = DvXW - Ofset.Value;
DvX4 = DvXW + Ofset.Value;



    if (WidthNishe < 600)
        Door1();
        else
        Door2();

function Dver(dX1, dY1, dX2, dY2, PZ)
{
    DvBlock = BeginBlock("����� ��������");
    Dvr = AddTrajectory("�����");
    Dvr.MaterialName = "������� ��� ��������";
    Dvr.MaterialWidth = 60;
    Dvr.Trajectory2D.AddRectangle(dX1, dY1, dX2, dY2);
    Dvr.Contour2D.Load("�������.frw");
    Dvr.PositionZ = PZ;
    Dvr.Build()
    ActiveMaterial.Make('��� EGGER 8 ��', 8); //��������� ����������
    DSP = AddFrontPanel(dX1 + 80.5, dY1 + 80.5, dX2 - 80.5, dY2 - 80.5, PZ + 3);
    DSP.TextureOrientation = ftoVertical;
    DSP.Name = "������ �����";
    DSP.Build();
    EndBlock();
}

function Door1()
{
    Model.Temp.Clear();
    SetCamera(p3dLeft);
    Front = GetEdge('������� �������� �������', AxisY).First.z;
    PZ = Front;
    Dver(DvX1, DvY1, DvX2, DvY2, PZ);
    DvBlock.AnimType =  AnimationType.DoorLeft;
    SetCamera(p3dFront);
    ViewAll();
}

function Door2()
{
    Model.Temp.Clear();
    SetCamera(p3dLeft);
    Front = GetEdge('������� �������� �������', AxisY).First.z;
    PZ = Front;
    Dver(DvX1, DvY1, DvX3, DvY2, PZ);
    DvBlock.AnimType = AnimationType.DoorLeft;
    Dver(DvX4, DvY1, DvX2, DvY2, PZ);
    DvBlock.AnimType = AnimationType.DoorRight;
    SetCamera(p3dFront);
    ViewAll();
}