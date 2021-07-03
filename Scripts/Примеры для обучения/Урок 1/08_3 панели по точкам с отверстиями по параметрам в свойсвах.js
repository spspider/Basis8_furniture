//��������� 3 ������ �� ������ � ���� ������
//������ p1, ����� p2 ����������
//

MakeProperties();

//��������� ������� �������� ���������
Thick = MtThickness();

//������ ����������� ���� ��� ����������������� ����������
//����� �� ���� �� ������ ������ ���� - �������� �������
while (true)
{
    p1 = GetPoint('������� ������ �����');
    p2 = GetPoint('������� ������ �����');

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
//�������� ������� ���������� ���� �������
    Make();
}

function Make()
{
    Panel = AddVertPanel(p1.z, p1.y, p2.z, p2.y, p1.x);
    //����������� ������ ���
    Panel.Name = '����� ��������';
    //��������� ���������� � ������� ������
    Panel.Contour.AddCircle((p2.z - p1.z) / 2, (p2.y - p1.y) / 2,
        Diam.Value / 2);
    //������ ������ � ���������� ��������
    Panel.Build();

    Panel = AddHorizPanel(p1.x + Thick, p1.z,
        p2.x, p2.z, p1.y);
    //����������� ������ ���
    Panel.Name = '���';
    //��������� ������������� � ������� ������
    Panel.Contour.AddRectangle(Otstup.Value, -Otstup.Value,
        p2.x - p1.x - Thick - Otstup.Value, -(p2.z - p1.z - Otstup.Value));
    //������ ������ � ���������� ��������
    Panel.Build();

    Panel = AddFrontPanel(p1.x + Thick, p1.y + Thick, p2.x, p2.y, p1.z);
    //����������� ������ ���
    Panel.Name = '������ ������';
    //��������� ������������� �� ������������ � ������� ������
    Panel.Contour.AddRoundRect(Otstup.Value, Otstup.Value,
        p2.x - p1.x - Thick - Otstup.Value, p2.y - p1.y - Thick - Otstup.Value,
        Rad.Value);
    //������ ������ � ���������� ��������
    Panel.Build();
}

function MakeProperties() {
    //�������� � ���������� ���� �������
    Prop = Action.Properties;

    Otstup = Prop.NewNumber('������ �� ����', 40);
    Diam = Prop.NewNumber('�������', 200);
    Rad = Prop.NewNumber('������', 30);
    OkBtn = Prop.NewButton('���������');
    OkBtn.Value = 'Ok';

    //��������� ������ ��������� �������� �������
    Prop.OnChange = function()
    {
        //�������� ������ �������� �� ������� �������
        DeleteNewObjects();
        //�������� ������� ���������� ���� �������
        Make();
    };

    //��������� ������� �� ������ ���������
    OkBtn.OnClick = function() {
        //�������� ������ �������� �� ������� �������
        DeleteNewObjects();
        //�������� ������� ���������� ���� �������
        Make();
        //�������� ������ � ������� ������ � ������� ������� �������
        Action.Commit()
    }
}


