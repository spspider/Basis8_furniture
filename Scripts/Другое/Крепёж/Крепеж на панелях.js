V1 = AddVertPanel(0, 0, 150, 300, 0);
V2 = AddVertPanel(0, 0, 150, 300, 200);
H = AddHorizPanel(0, 0, 200, 150, 100);

Screw = OpenFurniture('��������.f3d');
Screw.Mount(H, V1, 0, 0, 30);
Screw.Mount(H, V1, 0, 0, 120);
Screw.Mount(H, V2, 0, 0, 75);

Corner = OpenFurniture('������.f3d');
Corner.Mount(H, V1, 50, 0, 75);
Corner.Mount(H, V2, 100, 0, 30);
Corner.Mount(H, V2, 100, 300, 120);