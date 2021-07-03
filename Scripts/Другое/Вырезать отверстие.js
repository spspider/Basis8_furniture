// возьмЄм выделенный объект
Obj = Model.Selected;
// проверим, €вл€етс€ ли он панелью
if (Obj)
  Obj = Obj.AsPanel;
if (!Obj)
  Obj = GetPanel("”кажите панель");
if (Obj) {
    // укажем, что этот объект будет редактироватьс€
    StartEditing(Obj);
    p = GetPoint('”кажите центр отверсти€');
    p = Obj.ToObject(p);
    // переведем точку в систему координат контура панели
    Hole = NewContour();
    Hole.AddCircle(p.x, p.y, 10);
    Obj.Contour.Subtraction(Hole);
    Obj.Build();
};