Bok1 = GetPanel("������� 1-�� ������������ ������");
Bok2 = GetPanel("������� 2-�� ������������ ������");

x1 = Bok1.GabMax.x + 2;
x2 = Bok2.GabMin.x - 2;
z1 = Bok1.GabMin.z + 1;
z2 = Bok1.GabMax.z - 20;

Evrik = OpenFurniture('��������������.f3d')

function MoveOdj()
{
DeleteNewObjects()
Polka = AddHorizPanel(x1, z1, x2, z2, Action.Pos3.y);
zp1 = Polka.GabMin.z;
zp2 = Polka.GabMax.z;
Polka.PositionY = Action.Pos3.y
Evrik.Mount(Polka, Bok1, x1, Action.Pos3.y, zp1 + 64)
Evrik.Mount(Polka, Bok2, x2, Action.Pos3.y, zp1 + 64)
Evrik.Mount(Polka, Bok1, x1, Action.Pos3.y, zp2 - 32)
Evrik.Mount(Polka, Bok2, x2, Action.Pos3.y, zp2 - 32)
}

Action.ShowPoints = true;
Action.OnMove = function() {MoveOdj()};
Action.OnClick = function() {Action.Finish()};
Action.Continue();