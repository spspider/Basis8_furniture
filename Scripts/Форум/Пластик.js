FileOptions = 'Save.xml';
MakeProp();
Action.Properties.Load(FileOptions);
Action.OnFinish = function() {
  Action.Properties.Save(FileOptions);
}

BtnOk = NewButtonInput("���������")
BtnOk.OnChange = function() {
    PPP()
    Action.Finish()
}

PPP()
Action.Continue()

function PPP()
{
    DeleteNewObjects()
    MatPan.SetActive()
    Pan = AddFrontPanel(0, 0, 300, 600, 100 + MatPl.Thickness)
    Pan.AddPlastic(MatPl.Value, true)
    Pan.AddPlastic(MatPl.Value, false)
    Pan.Build()
}

function MakeProp()
{
    Prop = Action.Properties
    MatPan = Prop.NewMaterial('������')
    MatPl = Prop.NewMaterial('�������');
    Btn = Prop.NewButton('���������')

    Prop.OnChange = function() {
        PPP()
    }
    Btn.OnClick =  function() {
        PPP()
        Action.Finish()
    }
}