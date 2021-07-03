FileOptions = '���������.xml';
var CurBlock;
var CurPos = NewVector(0, 0, 0);

MakeProperties();

NewBtn = NewButtonInput('���������');
NewBtn.OnChange = function() {
    Action.Commit();
    Action.Finish();
}

if (!ParametricBlock) {
    NewBtn = NewButtonInput('�������� ��� ����');
    NewBtn.OnChange = function() {
        Action.Commit();
        NewTumba();
    }

    function NewTumba() {
        Make();
        Action.Hint = '������� ��������� �����';
        Action.ShowPoints = true;
        Action.OnMove = function() {
            CurBlock.Position = Action.Pos3;
            CurPos = Action.Pos3;
        };
        Action.OnClick = function() {
            Action.OnMove = undefined;
            Action.ShowPoints = false;
            Action.Hint = '������� ��������� �����';
        };
    }

    NewTumba();
} else
    Action.Hint = '������� ��������� �����';


Action.Continue();

Action.OnStart = function() {
    if (ParametricBlock) {
        OldKrishka = ParametricBlock.Find('������');
        OldLevBok = ParametricBlock.Find('�������� �����');

        if (OldKrishka && OldLevBok) {
            Dl.Value = OldKrishka.Contour.Width;
            H.Value = OldLevBok.Contour.Height + MatKorp.Thickness;
            Gl.Value = OldLevBok.Contour.Width;
        } else {
            alert('���� ���������� ������!')
            Action.Cancel();
        }
    }
    //��������� ������ ��������� �������� �������
    Prop.OnChange = function() {
        if (Fas.Value > Hd.Value) alert('��������������! ����� ������ ��� ������ ���.')
        Make(); //�������� ������� ���������� ���� �������
    };
    Make();
};

function MakeProperties() {
    //�������� � ���������� ���� �������
    Prop = Action.Properties;
    Image = Prop.NewImage('����� �������', '�����.wmf');
    Image.MaxHeight = 250;
    Dl = Prop.NewNumber('������', 500);
    Gl = Prop.NewNumber('�������', 400);
    H = Prop.NewNumber('������', 700);
    Hd = Prop.NewNumber('������ �� ���', 50);
    Fas = Prop.NewNumber('������ �����', 50);
    Korpus = Prop.NewGroup('������')
    MatKorp = Korpus.NewMaterial('�������� �������');
    KrVidimKorp = Korpus.NewButt('������� ������');
    KrNotVidimKorp = Korpus.NewButt('��������� ������');

    ZadnStenka = Prop.NewGroup('������ ������');
    MatZadnStenka = ZadnStenka.NewMaterial('��������');

    Dver = Prop.NewGroup('�����')
    MatDver = Dver.NewMaterial('��������');
    KrDver = Dver.NewButt('������');
    Petli = Dver.NewFurniture('�����');
    Freza = Dver.NewSelector('������� �����');
    TipFilenki = Dver.NewCombo('��� �������', '���1\n���2\n���3\n���4');
    Freza.OnClick = function() {
        Freza.Value = system.askFileName('frw');
    };

    OtstupFil = Dver.NewNumber('������ ������� �� ����', 80);
    Rad = Dver.NewNumber('������ ����������', 80);

    OkBtn = Prop.NewButton('���������');
    //��������� ������� �� ������ ���������
    OkBtn.OnClick = function() {
        Make(); //�������� ������� ���������� ���� �������
        Action.Finish();
    }
}

function Make() {
    //�������� ������ �������� �� ������� �������
    DeleteNewObjects();
    CurBlock = BeginParametricBlock("�����");
    //���������� ������� ������ ������ ��� ����������� ������������ ������� ����
    MatZadnStenka.SetActive();
    ThickZadSt = ActiveMaterial.Thickness;

    MatKorp.SetActive();
    //��������� ������� �������� ���������
    Thick = ActiveMaterial.Thickness;

    Krishka = AddHorizPanel(0, 0, Dl.Value, Gl.Value, H.Value - Thick);
    //����������� ������ ���
    Krishka.Name = '������';
    Krishka.AddButt(KrNotVidimKorp, 0);
    Krishka.AddButt(KrVidimKorp, 1);
    Krishka.AddButt(KrVidimKorp, 2);
    Krishka.AddButt(KrVidimKorp, 3);
    //����� ���
    Cut = Krishka.Cuts.Add();
    Traj = Cut.Trajectory;
    Traj.AddLine(0, -10, Dl.Value, -10);
    ContPaz = Cut.Contour;
    ContPaz.AddRectangle(0, 0, -ThickZadSt - 0.5, 10);
    Krishka.Build();

    LevBok = AddVertPanel(0, 0, Gl.Value, H.Value - Thick, 0);
    //����������� ������ ���
    LevBok.Name = '�������� �����';
    LevBok.Contour.Facet(0, 0, Fas.Value);
    LevBok.AddButt(KrNotVidimKorp, 0);
    LevBok.AddButt(KrVidimKorp, 1);
    //  LevBok.AddButt(KrNotVidimKorp, 2)
    LevBok.AddButt(KrNotVidimKorp, 3);
    LevBok.AddButt(KrNotVidimKorp, 4);
    Cut = LevBok.Cuts.Add();
    Traj = Cut.Trajectory;
    Traj.AddLine(10, 0, 10, H.Value - Thick);
    ContPaz = Cut.Contour;
    ContPaz.AddRectangle(0, 0, -ThickZadSt - 0.5, 10);
    LevBok.Build();

    PravBok = AddSymmetry(LevBok, NewVector(Dl.Value / 2, 0, 0), AxisX);
    //����������� ������ ���
    PravBok.Name = '�������� ������';

    Dno = AddHorizPanel(Thick, 0, Dl.Value - Thick, Gl.Value, Hd.Value);
    //����������� ������ ���
    Dno.Name = '���';
    Dno.AddButt(KrNotVidimKorp, 0);
    //    Dno.AddButt(KrVidimKorp, 1);
    Dno.AddButt(KrVidimKorp, 2)
    //    Dno.AddButt(KrVidimKorp, 3);
    Cut = Dno.Cuts.Add();
    Traj = Cut.Trajectory;
    Traj.AddLine(0, -10, Dl.Value - Thick, -10);
    ContPaz = Cut.Contour;
    ContPaz.AddRectangle(0, Thick, -ThickZadSt - 0.5, Thick - 10);
    Dno.Build();

    Cokol = AddFrontPanel(Thick, 0, Dl.Value - Thick, Hd.Value, Gl.Value - 20 - Thick);
    //����������� ������ ���
    Cokol.Name = '������';
    Cokol.AddButt(KrNotVidimKorp, 0);
    Cokol.Build();

    //������ ������ � �����
    Hp = H.Value - Thick - Hd.Value - Thick;
    //������ ����� � ������
    Hp = Hp / 2 - 0.5 * Thick;
    //������ ����� � ���������� ������� ���������
    Hp = Hp + Hd.Value + Thick;

    Polka = AddHorizPanel(Thick + 1, 10 + ThickZadSt, Dl.Value - Thick - 1, Gl.Value - 30, Hp);
    //����������� ������ ���
    Polka.Name = '�����';
    Polka.AddButt(KrNotVidimKorp, 0);
    Polka.AddButt(KrNotVidimKorp, 1);
    Polka.AddButt(KrVidimKorp, 2)
    Polka.AddButt(KrNotVidimKorp, 3);
    Polka.Build();

    MatZadnStenka.SetActive();
    ZadnStenka = AddFrontPanel(Thick - 9, Hd.Value + Thick - 9,
        Dl.Value - Thick + 9, H.Value - Thick + 9, 10);
    //����������� ������ ���
    ZadnStenka.Name = '������ ������';

    Block = BeginBlock("�����")
    MatDver.SetActive();
    ThickDver = ActiveMaterial.Thickness;
    Dver = AddFrontPanel(2, Hd.Value + 2, Dl.Value - 2, H.Value - 2, Gl.Value);
    //����������� ������ ���
    Dver.Name = '�����';
    for (var k = 0; k < 4; k++) {
        Dver.AddButt(KrDver, k)
    }
    Rucka = OpenFurniture('�����-����� 128 UN47_128.f3d');
    Rucka.Mount1(Dver, Dl.Value - 2 - 40, H.Value - 115, Gl.Value + ThickDver, 0);

    FileFreza = Freza.Value;
    if (system.fileExists(FileFreza)) {
        Cut = Dver.Cuts.Add();
        Traj = Cut.Trajectory;

        //      alert(TipFilenki.ItemIndex);

        switch (TipFilenki.ItemIndex) {
            case 0:
                {
                    p1 = NewPoint(OtstupFil.Value, OtstupFil.Value);
                    p2 = NewPoint(Dver.GSize.x - OtstupFil.Value, OtstupFil.Value);
                    p3 = NewPoint(Dver.GSize.x - OtstupFil.Value, Dver.GSize.y - 0.2 * Dver.GSize.y);
                    p4 = NewPoint(Dver.GSize.x / 2, Dver.GSize.y - OtstupFil.Value);
                    p5 = NewPoint(OtstupFil.Value, Dver.GSize.y - 0.2 * Dver.GSize.y);
                    L1 = Traj.AddLine(p1.x, p1.y, p2.x, p2.y);
                    L2 = Traj.AddLine(p2.x, p2.y, p3.x, p3.y);
                    D1 = Traj.AddArc3(p3, p4, p5);
                    L3 = Traj.AddLine(p5.x, p5.y, p1.x, p1.y);
                    Traj.RoundingEx(L1, L2, p2.x - 1, p2.y + 1, Rad.Value);
                    Traj.RoundingEx(L3, L1, p1.x + 1, p1.y + 1, Rad.Value);
                    Traj.RoundingEx(L2, D1, p3.x - 1, p3.y - 1, Rad.Value);
                    Traj.RoundingEx(L3, D1, p5.x + 1, p5.y - 1, Rad.Value);
                    break;
                }
            case 1:
                {
                    p1 = NewPoint(OtstupFil.Value, OtstupFil.Value);
                    p2 = NewPoint(Dver.GSize.x - OtstupFil.Value, OtstupFil.Value);
                    p3 = NewPoint(Dver.GSize.x - OtstupFil.Value, Dver.GSize.y - OtstupFil.Value);
                    p4 = NewPoint(OtstupFil.Value, Dver.GSize.y - OtstupFil.Value);
                    L1 = Traj.AddLine(p1.x, p1.y, p2.x, p2.y);
                    L2 = Traj.AddLine(p2.x, p2.y, p3.x, p3.y);
                    L3 = Traj.AddLine(p3.x, p3.y, p4.x, p4.y);
                    L4 = Traj.AddLine(p4.x, p4.y, p1.x, p1.y);
                    Traj.RoundingEx(L2, L3, p3.x - 1, p3.y - 1, Rad.Value);
                    Traj.RoundingEx(L3, L4, p4.x + 1, p4.y - 1, Rad.Value);
                    break;
                }
            case 2:
                {
                    S = Dver.GSize.x - 2 * OtstupFil.Value;
                    p1 = NewPoint(OtstupFil.Value, OtstupFil.Value + 0.5 * S);
                    p2 = NewPoint(Dver.GSize.x - OtstupFil.Value, OtstupFil.Value + 0.5 * S);
                    p3 = NewPoint(Dver.GSize.x - OtstupFil.Value, Dver.GSize.y - OtstupFil.Value);
                    p4 = NewPoint(OtstupFil.Value, Dver.GSize.y - OtstupFil.Value);
                    p5 = NewPoint(OtstupFil.Value + S * 0.5, OtstupFil.Value);
                    L2 = Traj.AddLine(p2.x, p2.y, p3.x, p3.y);
                    L3 = Traj.AddLine(p3.x, p3.y, p4.x, p4.y);
                    L4 = Traj.AddLine(p4.x, p4.y, p1.x, p1.y);
                    Traj.RoundingEx(L2, L3, p3.x - 0.5 * Rad.Value, p3.y - 0.5 * Rad.Value, Rad.Value);
                    Traj.RoundingEx(L3, L4, p4.x + 0.5 * Rad.Value, p4.y - 0.5 * Rad.Value, Rad.Value);
                    Traj.AddArc3(p1, p5, p2);
                    break;
                }
            case 3:
                {
                    O1 = Traj.AddCircle(Dver.GSize.x * 0.5, Dver.GSize.y * 0.5, Rad.Value);
                    break;
                }
        }
        Cut.Contour.Load(FileFreza);
        Cut.Contour.Move(0, Dver.Thickness);
    }
    Dver.Build();
    EndBlock();

    FPetli = Petli.Value;
    Block.AnimType = AnimationType.DoorLeft;
    Ost = (Dver.GSize.y - 200) % 32 //������� �� ������� ������ ����� - 200 �� 32
    k = (Dver.GSize.y - 200 - Ost) / 32 // ������� ��� ������������ ������ 32
    Dy = (Dver.GSize.y - k * 32) * 0.5 //�������� ���� �� ���� ��� ����� �����
    FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy, 0);
    FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy + k * 32, 0);

    Polkodergatel = OpenFurniture('��������������.f3d');
    Ost = (Gl.Value - 37 - 40) % 32;
    k = ((Gl.Value - 37 - 40) - Ost) / 32;
    Dz = Gl.Value - 37 - k * 32;
    Dz1 = Gl.Value - 37 - 32;
    Polkodergatel.Mount(Polka, LevBok, 2 * Thick, Hp, Dz);
    Polkodergatel.Mount(Polka, LevBok, 2 * Thick, Hp, Dz1);
    Polkodergatel.Mount(Polka, PravBok, 2 * Thick, Hp, Dz);
    Polkodergatel.Mount(Polka, PravBok, 2 * Thick, Hp, Dz1);

    Excentric = OpenFurniture('����������.f3d');
    Excentric.Mount(Dno, LevBok, 2 * Thick, Hd.Value, Dz);
    Excentric.Mount(Dno, LevBok, 2 * Thick, Hd.Value, Dz1);
    Excentric.Mount(Dno, PravBok, 2 * Thick, Hd.Value, Dz);
    Excentric.Mount(Dno, PravBok, 2 * Thick, Hd.Value, Dz1);

    Excentric.Mount(LevBok, Krishka, 2 * Thick, Hd.Value - Thick, Dz);
    Excentric.Mount(LevBok, Krishka, 2 * Thick, Hd.Value - Thick, Dz1);
    Excentric.Mount(PravBok, Krishka, 2 * Thick, Hd.Value - Thick, Dz);
    Excentric.Mount(PravBok, Krishka, 2 * Thick, Hd.Value - Thick, Dz1);

    Excentric.Mount(Cokol, LevBok, 2 * Thick, Hd.Value * 0.5, 0);
    Excentric.Mount(Cokol, PravBok, 2 * Thick, Hd.Value * 0.5, 0);

    Shkant = OpenFurniture('�����.f3d');
    Shkant.Mount(Dno, LevBok, 2 * Thick, Hd.Value, Dz + 32);
    Shkant.Mount(Dno, LevBok, 2 * Thick, Hd.Value, Dz1 - 32);
    Shkant.Mount(Dno, PravBok, 2 * Thick, Hd.Value, Dz + 32);
    Shkant.Mount(Dno, PravBok, 2 * Thick, Hd.Value, Dz1 - 32);

    Shkant.Mount(LevBok, Krishka, 2 * Thick, Hd.Value, Dz + 32);
    Shkant.Mount(LevBok, Krishka, 2 * Thick, Hd.Value, Dz1 - 32);
    Shkant.Mount(PravBok, Krishka, 2 * Thick, Hd.Value, Dz + 32);
    Shkant.Mount(PravBok, Krishka, 2 * Thick, Hd.Value, Dz1 - 32);

    EndParametricBlock();
    if (!ParametricBlock)
        CurBlock.Position = CurPos;
}