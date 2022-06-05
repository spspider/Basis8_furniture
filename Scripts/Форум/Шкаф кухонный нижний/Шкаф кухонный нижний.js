FileOptions = '���������.xml';

MakeProperties();

Action.Properties.Load(FileOptions);
Action.OnFinish = function() {
  Action.Properties.Save(FileOptions);
}

BtnMake = NewButtonInput('���������');
BtnMake.OnChange = function() {
  Make(); //�������� ������� ���������� ���� �������
  Action.Finish();
}

Make();

Action.Continue();

function MakeProperties() {
  //�������� � ���������� ���� �������
  Prop = Action.Properties;
  Image = Prop.NewImage('����� �������', '�����.wmf');
  Image.MaxHeight = 250;
  Dl = Prop.NewNumber('������', 500);
  Gl = Prop.NewNumber('�������', 400);
  H = Prop.NewNumber('������', 700);
  Hd = Prop.NewNumber('������ �� ���', 50);
  //Fas = Prop.NewNumber('������ �����', 50);
  Korpus = Prop.NewGroup('������')
  MatKorp = Korpus.NewMaterial('�������� �������');
  KrVidimKorp = Korpus.NewButt('������� ������');
  KrNotVidimKorp = Korpus.NewButt('��������� ������');
  
  Polki = Prop.NewGroup('�����');
  KolPolok = Polki.NewNumber('���������� �����', 2);
  OtstPol = Polki.NewNumber('������ �� ���/�� ��������', 2);
  OtstPered = Polki.NewNumber('������ �� ������', 20);
  OtstZad = Polki.NewNumber('������ �� ����', 0);
  PolkD= Polki.NewNumber('���������� ��������� ', 4);
  PolkMinRasst= Polki.NewNumber('��� ����� �� ����/�����', 208);
  //kolPolok.value=1;
  
  ZadnStenka = Prop.NewGroup('������ ������');
  MatZadnStenka = ZadnStenka.NewMaterial('��������');
  //KD=1;
  Dver = Prop.NewGroup('�����');
  KolDver = Dver.NewNumber('���������� ������', 1);
  //if (KD > 2)
  //{
  //alert ('������� ����� �� ����� 2�);
  //KD=1;
  //}
  //KolDver = KD
  
  MatDver = Dver.NewMaterial('��������');
  KrDver = Dver.NewButt('������');
  Petli = Dver.NewFurniture('�����');
  Freza = Dver.NewSelector('������� �����');
  TipFilenki = Dver.NewCombo('��� �������',  '���1\n���2\n���3\n���4');
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

  //��������� ������ ��������� �������� �������
  Prop.OnChange = function() {
    //if (Fas.Value > Hd.Value) alert('��������������! ����� ������ ��� ������ ���.')
    
    Make(); //�������� ������� ���������� ���� �������
  };
}

function Make() {
  //�������� ������ �������� �� ������� �������
  DeleteNewObjects();
  //���������� ������� ������ ������ ��� ����������� ������������ ������� ����
  MatZadnStenka.SetActive();
  ThickZadSt = ActiveMaterial.Thickness;

  MatKorp.SetActive();
  //��������� ������� �������� ���������
  Thick = ActiveMaterial.Thickness;

  //Krishka = AddHorizPanel(0, 0, Dl.Value, Gl.Value, H.Value - Thick);
  //����������� ������ ���
  //Krishka.Name = '������';
  //Krishka.AddButt(KrNotVidimKorp, 0);
  //Krishka.AddButt(KrVidimKorp, 1);
  //Krishka.AddButt(KrVidimKorp, 2);
  //Krishka.AddButt(KrVidimKorp, 3);
  //����� ���
  //Cut = Krishka.Cuts.Add();
  //Traj = Cut.Trajectory;
  //Traj.AddLine(0, -10, Dl.Value, -10);
  //ContPaz = Cut.Contour;
  //ContPaz.AddRectangle(0, 0, -ThickZadSt - 0.5, 10);
  //Krishka.Build();
//������ ����� ���,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  LevBok = AddVertPanel(0, Hd.Value+ Thick, Gl.Value, H.Value , 0);
  //����������� ������ ���
  LevBok.Name = '�������� �����';
  //LevBok.Contour.Facet(0, 0, Fas.Value);
  LevBok.AddButt(KrNotVidimKorp, 0);
  LevBok.AddButt(KrVidimKorp, 1);
    LevBok.AddButt(KrNotVidimKorp, 2)
  //LevBok.AddButt(KrNotVidimKorp, 3);
  LevBok.AddButt(KrNotVidimKorp, 4);
  //Cut = LevBok.Cuts.Add();
  //Traj = Cut.Trajectory;
  //Traj.AddLine(10, 0, 10, H.Value - Thick);
  //ContPaz = Cut.Contour;
  //ContPaz.AddRectangle(0, 0, -ThickZadSt - 0.5, 10);
  LevBok.Build();
//������ ������ ���,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  PravBok = AddSymmetry(LevBok, NewVector(Dl.Value / 2, 0, 0), AxisX);
  //����������� ������ ���
  PravBok.Name = '�������� ������';

  
  

 //������ ���...............................................................................
 Dno = AddHorizPanel(0, 0, Dl.Value , Gl.Value, Hd.Value);
 
  //����������� ������ ���
  Dno.Name = '���';
  Dno.AddButt(KrNotVidimKorp, 0);
  //    Dno.AddButt(KrVidimKorp, 1);
  Dno.AddButt(KrVidimKorp, 2)
  //    Dno.AddButt(KrVidimKorp, 3);
  //Cut = Dno.Cuts.Add();
  //Traj = Cut.Trajectory;
  //Traj.AddLine(0, -10, Dl.Value - Thick, -10);
  //ContPaz = Cut.Contour;
  //ContPaz.AddRectangle(0, Thick, -ThickZadSt - 0.5, Thick - 10);
  Dno.Build();
  

//������ ������,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  Cokol = AddFrontPanel(0, 5, Dl.Value , Hd.Value, Gl.Value - 10 - Thick);
  //����������� ������ ���
  Cokol.Name = '������';
  Cokol.AddButt(KrNotVidimKorp, 0);
  Cokol.AddButt(KrNotVidimKorp, 1);
  Cokol.AddButt(KrNotVidimKorp, 2);
  Cokol.AddButt(KrNotVidimKorp, 3);
  Cokol.Build();
  //......................................................
//��������� ��������� ������
  KolShag=Gl.Value / 32^ 0
  ShMontPl=(Gl.Value-KolShag*32);
  if (ShMontPl < 84)
  {
    while (ShMontPl<84)
        {
        KolShag=KolShag-1;
        ShMontPl=(Gl.Value-KolShag*32);
        }
  }
  
    //.....................................................................
  //��������� ���-�� ���������������
   KolPolkDer = PolkD.Value;
  // alert('kol polkod'+KolPolkDer);
  //alert(KolPolkDer.value);
  ShagPolkDer=96;
  RasstMegduKrPolk = (H.Value - Hd.Value- Thick- (KolPolkDer-1)*ShagPolkDer)/2;
  //���� �� ���� ��������� ��������������� ������
  alert('���������� ���������������  '+' '+ KolPolkDer+' ' + '���������� �� ����  ' + ' '+ RasstMegduKrPolk);
  //..............................................
  //������������� ������ ������� �� ������-���� ��� ���������
  Dz = Gl.Value - ShMontPl/2;
  Dz1 = Gl.Value -Gl.Value + ShMontPl/2;
  //....................................................
 // if(KolPolkDer = 0)
 // {
 // Sdvig=(H.Value - Thick - Hd.Value - Thick - KolPolok.Value*Thick)  / (KolPolok.Value + 1);
  //}
  //else
  //{
  Sdvig =RasstMegduKrPolk;
  //}
  //Sdvig=(H.Value - Thick - Hd.Value - Thick - KolPolok.Value*Thick)  / (KolPolok.Value + 1);
  Hp = Hd.Value+ Thick  ;
  HPol = Hp + Sdvig;
  //alert(HPol);
  for (var k = 0; k < KolPolkDer; k++)
  {
  OtvPolk = OpenFurniture('5x9.f3d');
                    OtvPolk.Mount1(LevBok, Thick, HPol, Dz, 0);
                    OtvPolk.Mount1(LevBok, Thick, HPol, Dz1, 0);
                     OtvPolk.Mount1(PravBok, Thick, HPol, Dz, 0);
                    OtvPolk.Mount1(PravBok, Thick, HPol, Dz1, 0);
                    HPol += ShagPolkDer
 
  }
  HPolki = Hp + Sdvig;
  for (var i = 0; i < KolPolok.Value; i++)
  {
  Polka = AddHorizPanel(Thick + OtstPol.Value, OtstZad.Value , Dl.Value - Thick - OtstPol.Value, Gl.Value - OtstPered.Value, HPolki+2.5);
                    Polka.Name = '�����';
                    Polka.AddButt(KrNotVidimKorp, 0);
                    Polka.AddButt(KrNotVidimKorp, 1);
                    Polka.AddButt(KrVidimKorp, 2);
                    Polka.AddButt(KrNotVidimKorp, 3);
                    Polka.Build();
                    Polkodergatel = OpenFurniture('��������������.f3d');
                    Polkodergatel.Mount(Polka, LevBok, 2 * Thick, HPolki, Dz);
                    Polkodergatel.Mount(Polka, LevBok, 2 * Thick, HPolki, Dz1);
                    Polkodergatel.Mount(Polka, PravBok, 2 * Thick, HPolki, Dz);
                    Polkodergatel.Mount(Polka, PravBok, 2 * Thick, HPolki, Dz1);
  HPolki+=ShagPolkDer;
  }
//������ ��������� ������,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  MontPlZad = AddHorizPanel(Thick,Gl.Value-Gl.Value, Dl.Value- Thick,ShMontPl, H.Value- Thick );
  //����������� ������ ���
  MontPlZad.Name = '���� �� ���';
   //MontPlZad.AddButt(KrNotVidimKorp, 0);
  MontPlZad.AddButt(KrVidimKorp, 2);
   MontPlZad.Build();
   
   MontPlPer = AddHorizPanel(Thick,Gl.Value-ShMontPl, Dl.Value- Thick,Gl.Value, H.Value- Thick );
  //����������� ������ ���
  MontPlPer.Name = '���� �� ���';
  MontPlPer.AddButt(KrNotVidimKorp, 2);
  MontPlPer.AddButt(KrVidimKorp, 0);
   MontPlPer.Build();
//,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,  
//������ ������ ������,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  MatZadnStenka.SetActive();
  ZadnStenka = AddFrontPanel(2, Hd.Value + 2,
    Dl.Value - 2, H.Value - 2, 0-ThickZadSt);
  //����������� ������ ���
  ZadnStenka.Name = '������ ������';
  ZadnStenka.Build();
  //,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  //������ �����,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
  KolD=KolDver.Value * 1;
  
  if (KolD==1)
  {
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

 
  FPetli = Petli.Value;
  Block.AnimType = AnimationType.DoorLeft;
  Ost = (Dver.GSize.y - 200) % 32 //������� �� ������� ������ ����� - 200 �� 32
  k = (Dver.GSize.y - 200 - Ost) / 32 // ������� ��� ������������ ������ 32
  Dy = (Dver.GSize.y - k * 32) * 0.5 //�������� ���� �� ���� ��� ����� �����
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy, 0);
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy + k * 32, 0);
  }
  else
  {
      Block = BeginBlock("�����")
      
    MatDver.SetActive();
    ThickDver = ActiveMaterial.Thickness;
    Dver = AddFrontPanel(2, Hd.Value + 2, Dl.Value /2- 2, H.Value - 2, Gl.Value);
    //����������� ������ ���
    Dver.Name = '�����1';
    for (var k = 0; k < 4; k++) {
      Dver.AddButt(KrDver, k)
    }
    Rucka = OpenFurniture('�����-����� 128 UN47_128.f3d');
    Rucka.Mount1(Dver, Dl.Value /2 - 42, H.Value - 115, Gl.Value + ThickDver, 0);

 
  FPetli = Petli.Value;
  Block.AnimType = AnimationType.DoorLeft;
  Ost = (Dver.GSize.y - 200) % 32 //������� �� ������� ������ ����� - 200 �� 32
  k = (Dver.GSize.y - 200 - Ost) / 32 // ������� ��� ������������ ������ 32
  Dy = (Dver.GSize.y - k * 32) * 0.5 //�������� ���� �� ���� ��� ����� �����
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy, 0);
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy + k * 32, 0);
 MatDver.SetActive();
 
    ThickDver = ActiveMaterial.Thickness;
    
    
    Dver1 = AddFrontPanel(Dl.Value /2+ 2, Hd.Value + 2, Dl.Value- 2, H.Value - 2, Gl.Value);
    //����������� ������ ���
    Dver.Name = '�����2';
    for (var k = 0; k < 4; k++) {
      Dver.AddButt(KrDver, k)
    }
    Rucka = OpenFurniture('�����-����� 128 UN47_128.f3d');
    Rucka.Mount1(Dver, Dl.Value /2+ 42, H.Value - 115, Gl.Value + ThickDver, 0);

 //alert ('�����-����� 128 UN47_128.f3d');
  FPetli = Petli.Value;
  Block.AnimType = AnimationType.DoorLeft;
  Ost = (Dver.GSize.y - 200) % 32 //������� �� ������� ������ ����� - 200 �� 32
  k = (Dver.GSize.y - 200 - Ost) / 32 // ������� ��� ������������ ������ 32
  Dy = (Dver.GSize.y - k * 32) * 0.5 //�������� ���� �� ���� ��� ����� �����
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy, 0);
  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy + k * 32, 0);
  }
  
  //Block = BeginBlock("�����")
  //  MatDver.SetActive();
  //  ThickDver = ActiveMaterial.Thickness;
  //  Dver = AddFrontPanel(2, Hd.Value + 2, Dl.Value - 2, H.Value - 2, Gl.Value);
    //����������� ������ ���
 //   Dver.Name = '�����';
  //  for (var k = 0; k < 4; k++) {
 //     Dver.AddButt(KrDver, k)
 //   }
 //   Rucka = OpenFurniture('�����-����� 128 UN47_128.f3d');
 //   Rucka.Mount1(Dver, Dl.Value - 2 - 40, H.Value - 115, Gl.Value + ThickDver, 0);

 
//  FPetli = Petli.Value;
//  Block.AnimType = AnimationType.DoorLeft;
 // Ost = (Dver.GSize.y - 200) % 32 //������� �� ������� ������ ����� - 200 �� 32
 // k = (Dver.GSize.y - 200 - Ost) / 32 // ������� ��� ������������ ������ 32
 // Dy = (Dver.GSize.y - k * 32) * 0.5 //�������� ���� �� ���� ��� ����� �����
 // FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy, 0);
//  FPetli.Mount(LevBok, Dver, 2 * Thick, Dver.PositionY + Dy + k * 32, 0);




//�������� 6�50.f3d
  Evrovint = OpenFurniture('�������� 6�50.f3d');
  Evrovint.Mount(LevBok, Dno,  Thick/2, Hd.Value, Dz);
  Evrovint.Mount(LevBok, Dno,  Thick/2, Hd.Value, Dz1);
  Evrovint.Mount(PravBok, Dno,Dl.Value-  Thick/2, Hd.Value, Dz);
  Evrovint.Mount(PravBok, Dno,Dl.Value-  Thick/2, Hd.Value, Dz1);
  Evrovint.Mount(MontPlZad, LevBok,  Thick/2, Hd.Value, Dz);
  Evrovint.Mount(MontPlZad, LevBok,  Thick/2, Hd.Value, Dz1);
  Evrovint.Mount(MontPlPer, PravBok,Dl.Value-  Thick/2, Hd.Value, Dz);
  Evrovint.Mount(MontPlPer, PravBok,Dl.Value-  Thick/2, Hd.Value, Dz1);
  
  //����� ������������ 100..125 � �����.f3d
  
Lag = OpenFurniture('����� ������������ 100..125 � �����.f3d');



// ����� �� ��������������

Lag.Mount1(Dno, 53, -50, Gl.Value-53, 0);
Lag.Mount1(Dno, Dl.Value -53, -50, Gl.Value-53, 0);
Lag.Mount1(Dno, Dl.Value -53, -50, 53, 0);
Lag.Mount1(Dno, 53, -50, 53, 0);

Samorez = OpenFurniture('����� 4�30.f3d');
Samorez.Mount1(MontPlPer, Dl.Value-Dl.Value+100, H.Value - Thick, Gl.Value -ShMontPl/2, 0);
Samorez.Mount1(MontPlPer, Dl.Value-100, H.Value - Thick, Gl.Value -ShMontPl/2, 0);
Samorez.Mount1(MontPlZad, Dl.Value-Dl.Value+100, H.Value - Thick, Gl.Value-Gl.Value +ShMontPl/2, 0);
Samorez.Mount1(MontPlZad, Dl.Value-100, H.Value - Thick, Gl.Value-Gl.Value +ShMontPl/2, 0);
//������ ������,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
//��� ��������� ������,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
ShagGvozd = 150; 
//,,,,,,,,,,,,,,,,,,,,,,,,,,, 
Gvozd = OpenFurniture('������ 1�16.f3d');
X=Dl.Value/2-ShagGvozd/2;
 for (k=Dl.Value/2+ShagGvozd/2;k<Dl.Value;k++)
 {
 Gvozd.Mount(Dno,ZadnStenka,   X, Hd.Value+Thick, Gl.Value-Gl.Value-ThickZadSt);
 Gvozd.Mount(Dno,ZadnStenka,   k, Hd.Value+Thick, Gl.Value-Gl.Value-ThickZadSt);
  Gvozd.Mount(MontPlZad,ZadnStenka,   X, H.Value-Thick, Gl.Value-Gl.Value-ThickZadSt);
 Gvozd.Mount(MontPlZad,ZadnStenka,   k, H.Value-Thick, Gl.Value-Gl.Value-ThickZadSt);
 k+=ShagGvozd;
 X+=-ShagGvozd;
 }
 Y=(H.Value-Hd.Value)/2-ShagGvozd/2;
 for (k=(H.Value-Hd.Value)/2+ShagGvozd/2;k<H.Value;k++)
 {
 Gvozd.Mount(LevBok,ZadnStenka,  Dl.Value -Dl.Value +Thick/2, Y,  Gl.Value-Gl.Value-ThickZadSt);
 Gvozd.Mount(LevBok,ZadnStenka,  Dl.Value -Dl.Value +Thick/2, k, Gl.Value-Gl.Value-ThickZadSt);
  Gvozd.Mount(PravBok,ZadnStenka,  Dl.Value -Thick/2, Y,  Gl.Value-Gl.Value-ThickZadSt);
 Gvozd.Mount(PravBok,ZadnStenka,  Dl.Value -Thick/2, k, Gl.Value-Gl.Value-ThickZadSt);
 k+=ShagGvozd;
 X+=-ShagGvozd;
 
 }
}
