// ����� ����
function SelectNishe() {
   var nishe = {};
   var x1 = GetEdge("������� �������", AxisY).First.x;
   var x2 = GetEdge("������� �������", AxisY).First.x;
   nishe.x1 = Math.min(x1, x2);
   nishe.x2 = Math.max(x1, x2);

   var y1 = GetEdge("������� �������", AxisY).First.y;
   var y2 = GetEdge("������� �������", AxisY).First.y;
   nishe.y1 = Math.min(y1, y2);
   nishe.y2 = Math.max(y1, y2);
   nishe.z1 = Model.GMin.z;
   nishe.z2 = Model.GMax.z;
   return nishe;
}