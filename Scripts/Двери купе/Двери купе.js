SetCamera(p3dFront);

OkBtn = NewButtonInput("���������")
        OkBtn.OnChange = function() {
        Action.Finish()
        }

Left = GetEdge("������� ����� �������", AxisY).First.x;
Right = GetEdge("������� ������ �������", AxisY).First.x;
Top = GetEdge("������� ������� �������", AxisX).First.y;
Bottom = GetEdge("������� ������ �������", AxisX).First.y;
SetCamera(p3dLeft);
Front = GetEdge('������� �������� �������', AxisY).First.z;

if (Left > Right) {
    AAA = Left;
    Left = Right;
    Right = AAA;
}
if (Bottom > Top) {
    AAA = Bottom;
    Bottom = Top;
    Top = AAA;
}

FileOptions = 'SaveKupe.xml';
MakeProp();
Action.Properties.Load(FileOptions);
Action.OnFinish = function() {
    Action.Properties.Save(FileOptions);
}

function MakeProp()
{
    Prop = Action.Properties;
    VidProf = Prop.NewCombo('��� ������� �����',  '������� �\n������� �');

    KolDv = Prop.NewCombo('���������� ������',  '2\n3\n4\n5');
    KolDv.OnChange = function ()
    {
        KolDv.ChildrenEnabled = KolDv.Value;
    }
    Centr4 = KolDv.NewBool('��� ����������� �������');
    if (KolDv.ItemIndex == 2)
        Centr4.Visible = true
    else
        Centr4.Visible = false

    KolRaz = Prop.NewCombo('���������� ������',  '1\n2\n3\n4\n5\n6\n7')
    ColorProf = Prop.NewCombo('���� �������',  '������ �������\n���� �������\n��������� ������\n������� �������\n������� ���������\n�����\n�����\n��� ��������\n���� �����������\n���� �����������\n����� ������')
    Prop.OnChange = function ()
    {
        if (KolDv.ItemIndex == 2)
            Centr4.Visible = true
        else
            Centr4.Visible = false

            DeleteNewObjects();
            PR()
            Raschet();
            MakeNap();
            MakeDoors();
     }

    Btn = Prop.NewButton('���������')
    Btn.OnClick = function()
    {
        Action.Finish()
    }
}

KolRaz.OnChange = function () {
    DeleteNewObjects();
    Raschet();
    MakeNap();
    MakeDoors();
}

KolDv.OnChange = function () {
    DeleteNewObjects();
    Raschet();
    MakeNap();
    MakeDoors();
}

//������� ���������� ��������, ���� � �.�.
WidthNiche = Right - Left; //������ ����
HeightNiche = Top - Bottom; //������ ����
LengthNaprav = WidthNiche - 2; //����� ������ � ������� ������������
HeightProf = HeightNiche - 40; //������ ������� �����
HeightProfBot = 56; //������ ������� ������� �����
HeightProfTop = 21; //������ �������� ������� �����
HeightProfCentr = 25; //������ �������� ������� �����
ThickRamcka = 14.5; //������� �������������� �������� �����
ThickNapBot = 8; //������� ������ ������������
WidthNapBot = 63; //������ ������ ������������
WidthNapTop = 82; //������ ������� ������������
ZagNapol = 8; //����������� ���������� ����� �������� 10 ��
ZdvigProf = 8.75; //���� �������������� ������� ������������ �������������
ZaglubRam = 0.5; //����������� �������������� �������� � ������� �����
AxisFront = WidthNapTop * 0.5; //Z �������� �����
AxisBack = WidthNapTop * 0.75; //Z ������ �����
ZvigNapBot = (WidthNapTop - WidthNapBot) * 0.5;

function PR()
{
    if (VidProf.ItemIndex == 0)
    {
        WidthProf = 26; //������ �������������� ������� �����
        ThickProf = 34; //������� �������������� ������� �����
        //���������� �� ������� ������ ����� ��� �������������� �������
        ZdvigRamckaCback = Front - AxisBack - (ThickRamcka * 0.5) - ZdvigProf;//�������������� �������
        DspProfCback = Front - AxisBack - (10 / 2) - ZdvigProf;//��� (����������)
        ZdvigProfCback = Front - AxisBack - (ThickProf * 0.5);//������� �����
        NapZ = Front - ZvigNapBot - ZdvigProf;//Z ������ ������������ ��� �������������� �������
        CutProf = '������� �.frw';
        MaterialProf = '������������ ������� � ' + ColorProf.Value;
    }
    else
    {
        WidthProf = 35; //������ ������������� ������� �����
        ThickProf = 34; //������� ������������� ������� �����
        //���������� �� ������� ������ ����� ��� ������������� �������
        ZdvigRamckaCback = Front - AxisBack - (ThickRamcka * 0.5);
        DspProfCback = Front - AxisBack - (10 / 2); //��� (����������)
        ZdvigProfCback = Front - AxisBack - (ThickProf * 0.5);//������� �����
        NapZ = Front - ZvigNapBot;//Z ������ ������������ ��� ������������� �������
        CutProf = '������� �.frw';
        MaterialProf = '������������ ������� � ' + ColorProf.Value;
    }
}

function Raschet()
{
    Nalog = KolDv.Value - 1; //���-�� ����������� ������
    //system.log("���� = " + WidthNiche);
    WidthDver = ((WidthNiche + (WidthProf * Nalog)) / KolDv.Value); //������ �����
    WidthDverC = Math.floor(WidthDver);
    Ost = ((WidthNiche + (WidthProf * Nalog)) % WidthDverC) / KolDv.Value;
    if (Ost > 0)
        Add = 1
        else
        Add = 0
    WidthDverC1 = WidthDverC + Add;
    Ost3 = (1 - Ost) * KolDv.Value;
    ZdviX = Ost3 * 0.25;
    LengthProfRam = (WidthDverC1 - (WidthProf * 2)) + (ZaglubRam * 2); //������ �������������� ��������
    LengthProfRam1 = Math.floor(LengthProfRam);
    //��������� ��� ��������� ��������������� �������
    Count = KolRaz.Value;
    Raztop = Top - 30 - HeightProfTop;//���� ����
    Razbotton = Bottom + 10 + HeightProfBot;//��� ����
    SectionRaz = Raztop - Razbotton;
    Section = (SectionRaz - ((Count - 1) * HeightProfCentr)) / Count;
    //����������� ���������� ��� ��������� ��������� ������ �� ��� X
    LeftX = Left + WidthProf; //����� ������� + ������� ������� �����
    RightX = WidthDverC1 - WidthProf; //������ ������� - ������� ������� ����
    LeftDsp = LeftX - ZagNapol; //������� ���������� �����
    RightDsp = RightX + ZagNapol + Left; //������� ���������� ������
    LeftRam = Left + WidthProf - ZaglubRam; //������� ����� �������� ��������
    SN = (WidthNiche * 0.5);
    SN1 = Math.floor(SN);
    //���������� ��������� ������
    HalfProf = WidthProf * 0.5
    Right5 = WidthNiche - WidthDverC1;//���������� � ������ �����
    Right3 = SN - (WidthDverC1 * 0.5)
}

function Doors4()
{
    WidthDver = (WidthNiche + (WidthProf * 2)) / KolDv.Value; //������ �����
    WidthDverC = Math.floor(WidthDver);
    Ost = ((WidthNiche + (WidthProf * 2)) % WidthDverC) / KolDv.Value;
    if (Ost > 0)
        Add = 1
        else
        Add = 0
    WidthDverC1 = WidthDverC + Add;
    Ost3 = (1 - Ost) * KolDv.Value;
    ZdviX = Ost3 * 0.5;
    LengthProfRam = (WidthDverC1 - (WidthProf * 2)) + (ZaglubRam * 2); //������ �������������� ��������
    LengthProfRam1 = Math.floor(LengthProfRam);
    RightX = WidthDverC1 - WidthProf; //������ ������� - ������� ������� ����
    RightDsp = RightX + ZagNapol + Left; //������� ���������� ������
    Right5 = WidthNiche - WidthDverC1;//���������� � ������ �����
}

function MakeNap()
{
    BotNap = AddExtrusion(); //������ ������������ ��� �������������� �������
    BotNap.MaterialName = "������������ ������ ������������ " + ColorProf.Value;
    BotNap.MaterialWidth = WidthNapBot;
    File = '������������ ������.frw';
    BotNap.Contour.Load(File);
    BotNap.Rotate(AxisY, -90);
    BotNap.Thickness = LengthNaprav;
    BotNap.Position = NewVector(Right - 1, Bottom, NapZ)
    BotNap.Name = "������������ ������";
    BotNap.Build();
    TopNap = AddExtrusion(); //������� ������������
    TopNap.MaterialName = "������������ ������� ������������ " + ColorProf.Value;
    TopNap.MaterialWidth = WidthNapTop;
    File = '������������ �������.frw';
    TopNap.Contour.Load(File);
    TopNap.Rotate(AxisY, -90);
    TopNap.Thickness = LengthNaprav;
    TopNap.Position = NewVector(Right - 1, Top, Front)
    TopNap.Name = "������������ �������";
    TopNap.Build();
}

function MakeDoors()
{
    switch (KolDv.ItemIndex)
    {
        case 0:
            DverC();//��������� 1-�� �����
            BlDoorC2 = AddCopy(BlDoorC);//��������� 2-�� �����
            BlDoorC2.Position = NewVector(Right5, 0, AxisFront)
            BlDoorC.AnimType = AnimationType.SDoorLeft;
            BlDoorC2.AnimType = AnimationType.SDoorRight;
            BlDoorC2.Build();
            break
        case 1:
            DverC();//��������� 1-�� �����
            BlDoorC2 = AddCopy(BlDoorC);//��������� 2-�� �����
            BlDoorC2.Position = NewVector(Right3, 0, AxisFront)
            BlDoorC3 = AddCopy(BlDoorC);//��������� 3-�� �����
            BlDoorC3.Position = NewVector(Right5, 0, 0)
            BlDoorC.AnimType = AnimationType.SDoorLeft;
            BlDoorC2.AnimType = AnimationType.SDoorRight;
            BlDoorC3.AnimType = AnimationType.SDoorRight;
            BlDoorC2.Build();
            BlDoorC3.Build();
            break
         case 2:
            if (Centr4.Value == true)
            {
                Doors4();
                DverC();//��������� 1-�� �����
                BlDoorC2 = AddCopy(BlDoorC);//��������� 2-�� �����
                BlDoorC2.Position = NewVector(SN - WidthDverC1, 0, AxisFront);
                BlDoorC3 = AddCopy(BlDoorC);//��������� 3-�� �����
                BlDoorC3.Position = NewVector(SN, 0, AxisFront);
                BlDoorC4 = AddCopy(BlDoorC);//��������� 4-�� �����
                BlDoorC4.Position = NewVector(Right5, 0, 0);
                BlDoorC.AnimType = AnimationType.SDoorLeft;
                BlDoorC2.AnimType = AnimationType.SDoorRight;
                BlDoorC3.AnimType = AnimationType.SDoorLeft;
                BlDoorC4.AnimType = AnimationType.SDoorRight;
                BlDoorC2.Build();
                BlDoorC3.Build();
                BlDoorC4.Build();
            }
            else
            {
                DverC();//��������� 1-�� �����
                BlDoorC2 = AddCopy(BlDoorC);//��������� 2-�� �����
                BlDoorC2.Position = NewVector((SN - WidthDverC1 + HalfProf), 0, AxisFront);
                BlDoorC3 = AddCopy(BlDoorC);//��������� 3-�� �����
                BlDoorC3.Position = NewVector((SN - WidthProf * 0.5), 0, 0);
                BlDoorC4 = AddCopy(BlDoorC);//��������� 4-�� �����
                BlDoorC4.Position = NewVector(Right5, 0, AxisFront);
                BlDoorC.AnimType = AnimationType.SDoorLeft;
                BlDoorC2.AnimType = AnimationType.SDoorRight;
                BlDoorC3.AnimType = AnimationType.SDoorLeft;
                BlDoorC4.AnimType = AnimationType.SDoorRight;
                BlDoorC2.Build();
                BlDoorC3.Build();
                BlDoorC4.Build();
            }
            break
        case 3:
            DverC();//��������� 1-�� �����
            BlDoorC2 = AddCopy(BlDoorC);//��������� 2-�� �����
            BlDoorC2.Position = NewVector((WidthDverC1 - ZdviX - WidthProf), 0, AxisFront);
            BlDoorC3 = AddCopy(BlDoorC);//��������� 3-�� �����
            BlDoorC3.Position = NewVector(Right3, 0, 0);
            BlDoorC4 = AddCopy(BlDoorC);//��������� 4-�� �����
            BlDoorC4.Position = NewVector((WidthNiche - WidthDverC1 * 2) + WidthProf + ZdviX, 0, AxisFront);
            BlDoorC5 = AddCopy(BlDoorC);//��������� 5-�� �����
            BlDoorC5.Position = NewVector(Right5, 0, 0);
            BlDoorC.AnimType = AnimationType.SDoorLeft;
            BlDoorC2.AnimType = AnimationType.SDoorRight;
            BlDoorC3.AnimType = AnimationType.SDoorLeft;
            BlDoorC4.AnimType = AnimationType.SDoorRight;
            BlDoorC5.AnimType = AnimationType.SDoorRight;
            BlDoorC2.Build();
            BlDoorC3.Build();
            BlDoorC4.Build();
            BlDoorC5.Build();
            break
    }
}

function DverC()
{
    BlDoorC = BeginBlock("����� ����")
    ProfCL = AddExtrusion(); //������� ����� ������������� �����
    ProfCL.MaterialName = MaterialProf;
    ProfCL.MaterialWidth = WidthProf;
    File = CutProf;
    ProfCL.Contour.Load(File);
    ProfCL.Rotate(AxisX, -90);
    ProfCL.Thickness = HeightProf;
    ProfCL.Position = NewVector(Left, Bottom + 10, ZdvigProfCback);
    ProfCL.Name = "������� �����";
    ProfCR = AddExtrusion(); //������� ����� ������������� ������
    ProfCR.MaterialName = MaterialProf;
    ProfCR.MaterialWidth = WidthProf;
    File = CutProf;
    ProfCR.Contour.Load(File);
    ProfCR.Contour.Symmetry(0, 0, 0, 1, false);
    ProfCR.Rotate(AxisX, -90);
    ProfCR.Thickness = HeightProf;
    ProfCR.Position = NewVector(WidthDverC1 + Left, Bottom + 10, ZdvigProfCback);
    ProfCR.Name = "������� �����";
    ProfBot = AddExtrusion(); //������� ������
    ProfBot.MaterialName = "����� ������ " + ColorProf.Value;
    ProfBot.MaterialWidth = HeightProfBot;
    File = '������� ������.frw';
    ProfBot.Contour.Load(File);
    ProfBot.Rotate(AxisY, 90);
    ProfBot.Thickness = LengthProfRam1;
    ProfBot.Position = NewVector(LeftRam, Bottom + 10, ZdvigRamckaCback)
    ProfBot.Name = "������� ������";
    ProfTop = AddExtrusion(); //������� �������
    ProfTop.MaterialName = "����� ������� " + ColorProf.Value;
    ProfTop.MaterialWidth = HeightProfTop;
    File = '������� �������.frw';
    ProfTop.Contour.Load(File);
    ProfTop.Rotate(AxisY, 90);
    ProfTop.Thickness = LengthProfRam1;
    ProfTop.Position = NewVector(LeftRam, Top - 30, ZdvigRamckaCback)
    ProfTop.Name = "������� �������";

    PosY1 = Razbotton;
    PosY2 = Razbotton;
    //������� ��������������
    for (var k = 1; k < Count; k++)
    {
        PosY1 += Section;
        ProfRazd = AddExtrusion();
        ProfRazd.MaterialName = "����� ������� " + ColorProf.Value;
        ProfRazd.MaterialWidth = HeightProfTop;
        File = '������� ��������������.frw';
        ProfRazd.Contour.Load(File);
        ProfRazd.Rotate(AxisY, 90);
        ProfRazd.Thickness = LengthProfRam1;
        ProfRazd.Position = NewVector(LeftRam, PosY1, ZdvigRamckaCback)
        ProfRazd.Name = "������� �������";
        PosY1 += HeightProfCentr;
    }
    //��������� ����������
    for (var k = 0; k < Count; k++)
    {
        PosY2;
        ActiveMaterial.Make('��� EGGER 10 ��', 10);
        Ydsp1 = (SectionRaz - (Section + HeightProfCentr) * (Count - 1)) + 8
        Ydsp = Math.floor(Ydsp1);
        DSP = AddFrontPanel(LeftDsp, PosY2 - 8, RightDsp, Ydsp + PosY2, DspProfCback);
        DSP.TextureOrientation = ftoVertical;
        DSP.Name = "������ �����"
        PosY2 = Section + HeightProfCentr + PosY2;
     }
    EndBlock();
    BlDoorC.Build();
}

PR()
Raschet();
MakeNap();
MakeDoors();
SetCamera(p3dFront);
Action.Continue();