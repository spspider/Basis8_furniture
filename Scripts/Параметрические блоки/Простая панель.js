// ������� ���������
Prop = Action.Properties;
w = Prop.NewNumber('������', 200);
h = Prop.NewNumber('������', 300);

// �������� ������ ���������� ��������������
Prop.NewButton('���������').OnClick = function() {
  Action.Finish();
}

// ������������� ������ ��� ��������� ��������
Prop.OnChange = function() {
    DeleteNewObjects(); // ������� ������� �������
    BeginParametricBlock("��������������� ������"); // � �������� ��������������� ����
    AddFrontPanel(0, 0, w.Value, h.Value, 0);
    EndParametricBlock();  // �������� �������� �����
}

// �������� ������ ��� ������� �������
Prop.OnChange();
// � ���� ���������� ��������������
Action.Continue();