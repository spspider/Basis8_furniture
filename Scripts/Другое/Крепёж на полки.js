Evrik = OpenFurniture('��������������.f3d')

Bok1 = GetPanel("������� 1-�� ������������ ������");
Bok2 = GetPanel("������� 2-�� ������������ ������");

x1 = Bok1.GabMax.x + 1;
x2 = Bok2.GabMin.x - 1;

while (true) {
    Polka = GetPanel("������� �������������� ������");
    Py = Polka.GabMin.y - 1;
    z1 = Polka.GabMin.z;
    z2 = Polka.GabMax.z;

    Evrik.Mount(Polka, Bok1, x1, Py, z1 + 64)
    Evrik.Mount(Polka, Bok2, x2, Py, z1 + 64)

    Evrik.Mount(Polka, Bok1, x1, Py, z2 - 32)
    Evrik.Mount(Polka, Bok2, x2, Py, z2 + 32)
    Action.Commit();
}