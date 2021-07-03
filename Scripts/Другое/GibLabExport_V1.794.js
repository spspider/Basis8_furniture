FileOptions = 'GibLabExport.prop';
version = 1.78;
/////////////////////////
// Панель свойств
/////////////////////////
goodId = 1;
partId = 1;
artNum = 1;
operationId = 1;
var products = [];
var opCutSheets = [];
var opCutBands = [];
var opEdges = [];
var holes = [];
Prop = Action.Properties;
Btn = Prop.NewButton('Экспортировать')
tbPrecision = Prop.NewNumber('Количество цифр после запятой (размеры деталей и кромок)');
tbPrecision.Value = 2;
cbUnion = Prop.NewBool('Объеденить детали в одно изделие');
cbUnion.Value = true;
if (system.apiVersion >= 1100){
cbDesignation = Prop.NewBool('Использовать обозначение вместо номера позиций');
cbDesignation.Value = false;
}
cbJoint = Prop.NewBool('Толщина прифуговки равна толщине кромки');
cbJoint.Value = false;

crCS = Prop.NewGroup('Листовой раскрой');
tbCSPanelL = crCS.NewNumber('Длина листа');
tbCSPanelL.Value = 2750;
tbCSPanelW = crCS.NewNumber('Ширина листа');
tbCSPanelW.Value = 1830;


crExp = Prop.NewGroup('Что экспортировать');
cbExpCont = crExp.NewBool('Фрезерование контура');
cbExpCont.Value = true;
cbExpContCutout = cbExpCont.NewBool('Фрезерование только зарезов, без смежных сторон');
cbExpContCutout.Value = false;
tbContToolD = cbExpCont.NewNumber('Диаметр фрезы для контура');
tbContToolD.Value = 20;
tbContOffset = cbExpCont.NewNumber('Выступ фрезы при сквозном фрезеровании контура');
tbContOffset.Value = 0;
tbContD = cbExpCont.NewNumber('Отступ от детади при входе/выходе фрезы при фрезерование контура');
tbContD.Value = 30;
cbContDiff = cbExpCont.NewBool('Фрезерование контура отдельно от сверления');
cbContDiff.Value = false;

cbExpCut = crExp.NewBool('Фрезерование и пазование');
cbExpCut.Value = true;
cbGrooveHor = cbExpCut.NewBool('Паз по горизонтали');
cbGrooveHor.Value = true;
cbGrooveVert = cbExpCut.NewBool('Паз по вертикали');
cbGrooveVert.Value = true;
cbGrooveThick = cbExpCut.NewNumber('Толщина пазовального инструмента');
cbGrooveThick.Value = 4.0;
tbCutOffset = cbExpCut.NewNumber('Выступ фрезы при сквозном фрезеровании');
tbCutOffset.Value = 2.0;

cbExpBore = crExp.NewBool('Сверления');
cbExpBore.Value = true;
tbExpBoreThick = cbExpBore.NewNumber('Минимальная толщина для сверления');
tbExpBoreThick.Value = 6.1;
tbExpBoreMinD = cbExpBore.NewNumber('Минимальный диаметр отверстий');
tbExpBoreMinD.Value = 1.5;
tbBoreOffset = cbExpBore.NewNumber('Выступ сверла при сквозном сверлении');
tbBoreOffset.Value = 2.0;
tbBoreThS = cbExpBore.NewBool("Для сквозных сверлений добавить суффикс 'Th' в наименование инструмента");
tbBoreThS.Value = false;
cbExpKomp = crExp.NewBool('Комплектующие');
cbExpKomp.Value = false;
cbExpProf = crExp.NewBool('Профили');
cbExpProf.Value = false;
grooveRectMsg = true;
ClipPanel = false;
Action.Properties.Load(FileOptions);
Action.OnFinish = function() {
    Action.Properties.Save(FileOptions);
}
Btn.OnClick = function() {
    exportGibLab();
    Action.Finish();
}
Action.Continue();

function exportGibLab() {
    try {
        //////////////////////////
        //расстановка позиций
        //////////////////////////
        system.log(system.apiVersion); //!!!
        grooveRectMsg = true;
        ClipPanel = false;
        artNull = false;

        Model.forEachPanel(function(node) {
            artNull |= node.ArtPos == null || node.ArtPos == '';
        })
        /////////////////////////
        time = Date.now();
        /////////////////////////
        Action.Hint = 'Процесс экспорта в GibLab. Подождите!';
        if (cbExpBore.Value) {
            Model.forEach(function(node) {
                if (node != null && node.Holes != null) {
                    for (i = 0; i < node.Holes.Count; i++) {
                        hole = node.Holes[i];
                        if (tbExpBoreMinD.Value <= hole.Diameter)
                            holes.push(new Hole(node.ToGlobal(hole.Position), node.ToGlobal(hole.EndPosition()), node.NToGlobal(hole.Direction), hole));
                    }
                }
            })
        }
        artNum = 1;
        product = new Product(getModelName());
        product.code = getModelCode();
        if (cbUnion.Value) {
            product.objs.push(Model);
        } else {
            iterateModelForProduct(Model, product);
        }

        if (product.objs.length > 0)
            products.unshift(product);
        /////////////////////////
        for (pi = 0; pi < products.length; pi++) {
            var p = products[pi];
            for (oi = 0; oi < p.objs.length; oi++) {
                var pn = p.objs[oi];
                iterateProductModel(p, pn);
            }
        }
        //

        if (!cbUnion.Value && product.parts.length == 0 && (!cbExpKomp.Value || product.parts.furns == 0) && (!cbExpProf.Value || product.parts.bands == 0)) {
            for (i = 0; i < products.length; i++) {
                if (products[i] == product)
                    products.splice(i, 1);
            }
        }

        //
        //if (ClipPanel)
        //    alert('Для экспорта не используйте облицовку кромок деталей "БЕЗ ПОДРЕЗКИ"!\nПроверьте размеры и контуры деталей!');

        //
        var precision = Math.round(tbPrecision.Value < 0 ? 0 : tbPrecision.Value > 2 ? 2 : tbPrecision.Value);
        //
        system.log("TIME1: " + (Date.now() - time));
        var xml = '<?xml version="1.0" encoding="windows-1251"?>';
        xml += '<project importBMV="' + version + '">\r\n';
        for (pi = 0; pi < products.length; pi++) {
            var product = products[pi];
            product.id = goodId++;
            xml += '<good typeId="product" id="' + product.id + '" count="1" name="' + escape(product.name) + '" ' + (product.code == null ? '' : 'code="' + escape(product.code) + '"') + '>';
            product.parts.sort(sortParts);
            for (ppi = 0; ppi < product.parts.length; ppi++) {
                var part = product.parts[ppi];
                part.id = partId++;
                part.name = '№' + part.ArtPos + ' ' + escape(part.name);
                xml += '<part id="' + part.id + '" name="' + part.name + '" dl="' + rnd(part.dl, precision) + '" dw="' + rnd(part.dw, precision) + '" count="' + part.count + '" txt="' + part.txt + '" code="' + part.ArtPos + '" part.code="' + part.ArtPos + '"';
                if (part.el[0])
                    xml += ' elt="@operation#' + part.el[0].id + '"';
                if (part.el[1])
                    xml += ' elb ="@operation#' + part.el[1].id + '"';
                if (part.el[2])
                    xml += ' ell="@operation#' + part.el[2].id + '"';
                if (part.el[3])
                    xml += ' elr="@operation#' + part.el[3].id + '"';
                xml += '/>';
                part.cXNC = "";
            }
            for (ppi = 0; ppi < product.bands.length; ppi++) {
                var part = product.bands[ppi];
                xml += '<part id="' + (part.id = partId++) + '" name="№ ' + part.ArtPos + '" dl="' + rnd(part.dl, precision) + '" code="' + part.ArtPos + '" part.code="' + part.ArtPos + '" count="' + part.count + '"/>';

            }
            if (cbExpKomp.Value && product.furns.length > 0) {
                product.kompId = operationId++;
                xml += '<operation id="' + product.kompId + '"/>';
            }
            xml += ' </good>';
        }

        for (oi = 0; oi < opCutSheets.length; oi++) {
            var opCutSheet = opCutSheets[oi];
            amn = opCutSheet.name.split(/\r\n|\r|\n/g);
            toolId = goodId++;
            xml += '<good typeId="tool.cutting" id="' + toolId + '"/>';
            sheetId = goodId++;
            xml += '<good typeId="sheet" id="' + sheetId + '" t="' + rnd(opCutSheet.t, precision) + '"';
            if (amn.length > 0)
                xml += ' name="' + escape(amn[0]) + '"'
            if (amn.length > 1)
                xml += ' code="' + escape(amn[1]) + '"';
            xml += '>';
            xml += '<part id="' + (partId++) + '" count="10000" l="'+rnd(tbCSPanelL.Value, precision)+ '" w="'+rnd(tbCSPanelW.Value, precision)+ '"/>';
            xml += '</good>';
            xml += '<operation typeId="CS" id="' + (operationId++) + '" tool1="' + toolId + '" cSizeMode="1">';
            xml += '<material id="' + sheetId + '"/>';
            opCutSheet.parts.sort(sortParts);
            for (opi = 0; opi < opCutSheet.parts.length; opi++) {
                var part = opCutSheet.parts[opi];
                if (part.id != null)
                    xml += '<part id="' + part.id + '" />';
            }
            xml += '</operation>';
        }


        for (oi = 0; oi < opEdges.length; oi++) {
            var opEdge = opEdges[oi];
            amn = opEdge.name.split(/\r\n|\r|\n/g);
            toolId = goodId++;
            xml += '<good typeId="tool.edgeline" id="' + toolId + '"';
            if (cbJoint.Value)
                xml += ' elWidthPreJoint="' + rnd(opEdge.t, precision) + '"';
            xml += '/>';
            bandId = goodId++;
            xml += '<good typeId="band" id="' + bandId + '" t="' + rnd(opEdge.t, precision) + '" w="' + rnd(opEdge.w, precision) + '"';
            if (amn.length > 0)
                xml += ' name="' + escape(amn[0]) + '"'
            if (amn.length > 1)
                xml += ' code="' + escape(amn[1]) + '"';
            xml += '/>';
            xml += '<operation typeId="EL" id="' + opEdge.id + '" tool1="' + toolId + '" >';
            xml += '<material id="' + bandId + '"/>';

            for (opi = 0; opi < opEdge.parts.length; opi++) {
                var part = opEdge.parts[opi];
                if (part.id != null)
                    xml += '<part id="' + part.id + '" />';
            }
            xml += '</operation>';
        }

        if (cbExpProf.Value)
            for (oi = 0; oi < opCutBands.length; oi++) {
                var opCutBand = opCutBands[oi];
                amn = opCutBand.MaterialName.split(/\r\n|\r|\n/g);
                toolId = goodId++;
                xml += '<good typeId="tool.cutting" id="' + toolId + '"/>';
                bandId = goodId++;
                width = 3200;
                xml += '<good typeId="band" id="' + bandId + '" t="' + rnd(opCutBand.mt, precision) + '" w="' + rnd(opCutBand.mw, precision) + '" l="3200"';
                if (amn.length > 0)
                    xml += ' name="' + escape(amn[0]) + '"'
                if (amn.length > 1)
                    xml += ' code="' + escape(amn[1]) + '"';
                xml += '>';
                xml += '<part id="' + (partId++) + '" count="10000" l="3200" w="' + rnd(opCutBand.mw, precision) + '"/>';
                xml += '</good>';
                xml += '<operation typeId="CL" id="' + (operationId++) + '" tool1="' + toolId + '" cSizeMode="1">';
                xml += '<material id="' + bandId + '"/>';
                opCutBand.bands.sort(sortParts);;
                for (opi = 0; opi < opCutBand.bands.length; opi++)
                    xml += '<part id="' + opCutBand.bands[opi].id + '" />';
                xml += '</operation>';
            }

        if (cbExpKomp.Value) {
            furns = [];
            for (pi = 0; pi < products.length; pi++) {
                var product = products[pi];
                for (pfi = 0; pfi < product.furns.length; pfi++) {

                    var pf = product.furns[pfi]; // gsv: var pf = product.furns;
                    furn = null;
                    for (fi = 0; fi < furns.length; fi++) {
                        var f = furns[fi];
                        if (pf.name == f.name && pf.unit == f.unit) {
                            furn = f;
                            break;
                        }
                    }
                    if (furn == null) {
                        pf.id = goodId++;
                        furns.push(pf);
                    } else {
                        pf.id = furn.id;
                    }
                }
            }

            for (fi = 0; fi < furns.length; fi++) {
                var furn = furns[fi];
                amn = furn.name.split(/\r\n|\r|\n/g);
                xml += '<good typeId="simple" id="' + furn.id + '" unit="' + furn.unit + '" count="' + furn.count + '" cost="' + furn.price + '"';
                if (amn.length > 0)
                    xml += ' name="' + escape(amn[0]) + '"'
                if (amn.length > 1)
                    xml += ' code="' + escape(amn[1]) + '"';
                xml += '/>';
            }

            for (pi = 0; pi < products.length; pi++) {
                var product = products[pi];
                if (product.furns.length > 0) {
                    xml += '<operation typeId="O" typeName="Комплектующие" id="' + product.kompId + '">';
                    for (fi = 0; fi < product.furns.length; fi++)
                        xml += '<material  id="' + product.furns[fi].id + '" count="' + product.furns[fi].count + '"/>';
                    xml += '</operation>';
                }
            }
        }
        contToolName = '';
        for (pi = 0; pi < products.length; pi++) {
            var product = products[pi];
            for (ppi = 0; ppi < product.parts.length; ppi++) {
                contToolName = null;
                var part = product.parts[ppi];
                code = '' + part.ArtPos;
                for (i = code.length; i < 4; i++)
                    code = '0' + code;
                partId = '' + part.id;
                for (i = partId.length; i < 3; i++)
                    partId = '0' + partId;
                contXNC = null;

                if (cbExpCont.Value && part.contour.length > 0) {
                    contToolName = 'Mill' + rnd2s(tbContToolD.Value);
                    contXNC += '<tool name="' + contToolName + '" d="' + rnd2s(tbContToolD.Value) + '"/>';
                    contXNC += '<var comment="Глубина сквозного фрезерования контура" name="contMillDepth" type="double" expr="dz' + (tbContOffset.Value > 0 ? '+' + rnd2(tbContOffset.Value) : '') + '"/>';
                    d = tbContD.Value;
                    for (var j = 0; j < part.contour.length; j++) {
                        contour = part.contour[j];
                        if (contour.path.length == 0)
                            continue;
                        cor = contour.clockOtherWise ? 2 : 1;
                        //Вывод входа фрезы на край детели
                        es = contour.path[0];
                        if ((es.Type == 1 || es.Type == 2) && !(rnd1(es.sx) == 0 || rnd1(es.sy) == 0 || rnd1(part.cl - es.sx) == 0 || rnd1(part.cw - es.sy) == 0)) {
                            minL = 1000000;
                            minI = -1;
                            for (var i = 0; i < contour.path.length; i++) {
                                e = contour.path[i];
                                dist = getDistance(0, e.sy, e.sx, e.sy);
                                if (dist < minL) {
                                    minL = round2(dist);
                                    minI = i;
                                }
                                dist = getDistance(e.sx, 0, e.sx, e.sy);
                                if (dist < minL) {
                                    minL = round2(dist);
                                    minI = i;
                                }
                                dist = getDistance(part.cl, e.sy, e.sx, e.sy);
                                if (dist < minL) {
                                    minL = round2(dist);
                                    minI = i;
                                }
                                dist = getDistance(e.sx, part.cw, e.sx, e.sy);
                                if (dist < minL) {
                                    minL = round2(dist);
                                    minI = i;
                                }
                            }
                            if (minI > -1) {
                                for (var c = 0; c < minI; c++)
                                    contour.path.push(contour.path.shift());
                            }
                        }
                        //Если радиус вначале или вконце
                        se = contour.path[0];
                        ee = contour.path[contour.path.length - 1];
                        if (!isCorner(se.sx, se.sy, part.cl, part.cw) && se.Type != 1 || !isCorner(ee.ex, ee.ey, part.cl, part.cw) && ee.Type != 1) {
                            posL = -1;
                            posLC = 0;
                            for (var i = 0; i < contour.path.length; i++) {
                                contElement = contour.path[i];
                                if (contElement.lineSide) {
                                    posLC++;
                                    if (posLC == 1) {
                                        posL = i;
                                    } else if (posLC == 2) {
                                        break;
                                    }
                                } else {
                                    posL = -1;
                                    posLC = 0;
                                }
                            }
                            if (posL > -1) {
                                for (var c = 0; c < (posL + 1); c++)
                                    contour.path.push(contour.path.shift());
                            }
                        }

                        //Удаление вначале до зареза
                        while (contour.path.length > 1) {
                            e = contour.path[0];
                            ee = contour.path[1];
                            if (ee.Type == 2) {
                                if (isCorner(ee.sx, ee.sy, part.cl, part.cw)) {
                                    contour.path.splice(0, 1);
                                    continue;
                                } else if (isSide(ee.sx, ee.sy, part.cl, part.cw)) {
                                    p = arcBorderIntersects(ee.sx, ee.sy, d, part.cl, part.cw, ee.cx, ee.cy, ee.r);
                                    if (p != null && getMinDistToBorderNum(p[0], p[1], part.cl, part.cw, d) == getMinDistToBorderNum(ee.sx, ee.sy, part.cl, part.cw, d)) {
                                        contour.path.splice(0, 1);
                                        continue;
                                    }
                                }
                            }
                            if (e.lineSideFull || e.lineSide && (cbExpContCutout.Value || ee.Type == 1)) {
                                contour.path.splice(0, 1);
                                continue;
                            }
                            break;
                        }
                        //Удаление вконце до зареза
                        while (contour.path.length > 1) {
                            i = contour.path.length - 1;
                            e = contour.path[i];
                            ee = contour.path[i - 1];
                            if (ee.Type == 2) {
                                if (isCorner(ee.ex, ee.ey, part.cl, part.cw)) {
                                    contour.path.splice(i, 1);
                                    continue;
                                } else if (isSide(ee.ex, ee.ey, part.cl, part.cw)) {
                                    p = arcBorderIntersects(ee.ex, ee.ey, d, part.cl, part.cw, ee.cx, ee.cy, ee.r);
                                    if (p != null && getMinDistToBorderNum(p[0], p[1], part.cl, part.cw, d) == getMinDistToBorderNum(ee.ex, ee.ey, part.cl, part.cw, d)) {
                                        contour.path.splice(i, 1);
                                        continue;
                                    }
                                }
                            }
                            if (e.lineSideFull || e.lineSide && (cbExpContCutout.Value || ee.Type == 1)) {
                                contour.path.splice(i, 1);
                                continue;
                            }
                            break;
                        }
                        startMS = true;
                        for (var i = 0; i < contour.path.length; i++) {
                            contElement = contour.path[i];
                            if (contElement.Type == 1) {
                                if (i > 0 && contElement.lineSide && contour.path[i - 1].Type == 1 && (i == (contour.path.length - 1) || contour.path[i + 1].Type == 1)) {
                                    //Разрыв
                                    startMS = true;
                                    continue;
                                }
                                sx = contElement.sx, sy = contElement.sy, ex = contElement.ex, ey = contElement.ey;
                                if (startMS) {
                                    //system.log("x="+rnd1(sx)+" y="+rnd1(sy)+" x="+rnd1(rnd1(part.cl - sx))+" yy="+rnd1(rnd1(part.cw - sy)));
                                    if (!contour.inner && d > 0.01 && (rnd1(sx) == 0 || rnd1(sy) == 0 || rnd1(part.cl - sx) == 0 || rnd1(part.cw - sy) == 0)) {
                                        a = Math.atan2(sy - ey, sx - ex);
                                        sx += d * Math.cos(a), sy += d * Math.sin(a);
                                    }
                                    contXNC += '<ms x="' + rnd4s(part.offsetX + sx) + '" y="' + rnd4s(part.offsetY + sy) + '" dp="contMillDepth" name="' + contToolName + '" c="' + cor + '"/>';
                                    startMS = false;
                                }
                                if (!contour.inner && d > 0.01 && (rnd1(ex) == 0 || rnd1(ey) == 0 || rnd1(part.cl - ex) == 0 || rnd1(part.cw - ey) == 0)) {
                                    if (i == (contour.path.length - 1) || (contour.path[i + 1].lineSide && (i == (contour.path.length - 2) || contour.path[i + 2].Type == 1))) {
                                        a = Math.atan2(ey - sy, ex - sx);
                                        ex += d * Math.cos(a), ey += d * Math.sin(a);
                                    }
                                }
                                contXNC += '<ml x="' + rnd4s(part.offsetX + ex) + '" y="' + rnd4s(part.offsetY + ey) + '"/>';
                            } else if (contElement.Type == 2) {
                                sx = contElement.sx, sy = contElement.sy, ex = contElement.ex, ey = contElement.ey;
                                if (startMS) {
                                    pb = null;
                                    if (contour.inner || d < 0.01) {
                                        pb = [];
                                        pb[0] = sx;
                                        pb[1] = sy;
                                    } else if ((rnd1(sx) == 0 || rnd1(sy) == 0 || rnd1(part.cl - sx) == 0 || rnd1(part.cw - sy) == 0))
                                        pb = arcBorderIntersects(sx, sy, d, part.cl, part.cw, contElement.cx, contElement.cy, contElement.r);
                                    if (pb == null) {
                                        a = Math.atan2(sy - contElement.cy, sx - contElement.cx);
                                        dcx = sx + d * Math.cos(a);
                                        dcy = sy + d * Math.sin(a);
                                        ang = a + (contElement.dir ? -Math.PI / 2.0 : Math.PI / 2.0);
                                        dsx = dcx + d * Math.cos(ang);
                                        dsy = dcy + d * Math.sin(ang);
                                        contXNC += '<ms x="' + rnd4s(part.offsetX + dsx) + '" y="' + rnd4s(part.offsetY + dsy) + '" dp="contMillDepth" name="' + contToolName + '" c="' + cor + '"/>';
                                        contXNC += '<mac x="' + rnd4s(part.offsetX + sx) + '" y="' + rnd4s(part.offsetY + sy) + '" cx="' + rnd4s(part.offsetX + dcx) + '" cy="' + rnd4s(part.offsetY + dcy) + '" dir="' + !contElement.dir + '"/>';
                                    } else {
                                        sx = pb[0], sy = pb[1];
                                        contXNC += '<ms x="' + rnd4s(part.offsetX + sx) + '" y="' + rnd4s(part.offsetY + sy) + '" dp="contMillDepth" name="' + contToolName + '" c="' + cor + '"/>';
                                    }
                                    startMS = false;
                                }

                                pb = null;
                                if (i == (contour.path.length - 1) && d > 0.01) {
                                    if (!contour.inner && (rnd1(ex) == 0 || rnd1(ey) == 0 || rnd1(part.cl - ex) == 0 || rnd1(part.cw - ey) == 0)) {
                                        pb = arcBorderIntersects(ex, ey, d, part.cl, part.cw, contElement.cx, contElement.cy, contElement.r);
                                        if (pb != null)
                                            ex = pb[0], ey = pb[1];
                                    }
                                }
                                contXNC += '<mac x="' + rnd4s(part.offsetX + ex) + '" y="' + rnd4s(part.offsetY + ey) + '" cx="' + rnd4s(part.offsetX + contElement.cx) + '" cy="' + rnd4s(part.offsetY + contElement.cy) + '" dir="' + contElement.dir + '"/>';
                                if (i == (contour.path.length - 1) && pb == null && !contour.inner && d > 0.01) {
                                    a = Math.atan2(ey - contElement.cy, ex - contElement.cx);
                                    dcx = ex + d * Math.cos(a);
                                    dcy = ey + d * Math.sin(a);
                                    ang = a + (contElement.dir ? Math.PI / 2.0 : -Math.PI / 2.0);
                                    dex = dcx + d * Math.cos(ang);
                                    dey = dcy + d * Math.sin(ang);
                                    contXNC += '<mac x="' + rnd4s(part.offsetX + dex) + '" y="' + rnd4s(part.offsetY + dey) + '" cx="' + rnd4s(part.offsetX + dcx) + '" cy="' + rnd4s(part.offsetY + dcy) + '" dir="' + !contElement.dir + '"/>';

                                }

                            } else if (contElement.Type == 3) {
                                contXNC += '<ms x="' + rnd4s(part.offsetX + contElement.cx) + '" y="' + rnd4s(part.offsetY + contElement.cy - contElement.r) + '" dp="contMillDepth" name="' + contToolName + '" c="' + cor + '"/>';
                                contXNC += '<mac x="' + rnd4s(part.offsetX + contElement.cx - contElement.r) + '" y="' + rnd4s(part.offsetY + contElement.cy) + '" cx="' + rnd4s(part.offsetX + contElement.cx) + '" cy="' + rnd4s(part.offsetY + contElement.cy) + '" dir="false"/>';
                                contXNC += '<mac x="' + rnd4s(part.offsetX + contElement.cx) + '" y="' + rnd4s(part.offsetY + contElement.cy + contElement.r) + '" cx="' + rnd4s(part.offsetX + contElement.cx) + '" cy="' + rnd4s(part.offsetY + contElement.cy) + '" dir="false"/>';
                                contXNC += '<mac x="' + rnd4s(part.offsetX + contElement.cx + contElement.r) + '" y="' + rnd4s(part.offsetY + contElement.cy) + '" cx="' + rnd4s(part.offsetX + contElement.cx) + '" cy="' + rnd4s(part.offsetY + contElement.cy) + '" dir="false"/>';
                                contXNC += '<mac x="' + rnd4s(part.offsetX + contElement.cx) + '" y="' + rnd4s(part.offsetY + contElement.cy - contElement.r) + '" cx="' + rnd4s(part.offsetX + contElement.cx) + '" cy="' + rnd4s(part.offsetY + contElement.cy) + '" dir="false"/>';
                                startMS = true;
                            }
                        }
                    }
                    if (cbContDiff.Value || (!cbExpBore.Value && !cbExpCut.Value) || (part.bFront.length == 0 && part.cFront.length == 0)) {
                        xml += '<operation typeId="XNC" id="' + (operationId++) + '" side="1" bySizeDetail="true" code="' + code + 'x' + partId + 'x0" typeName="' + part.name + '" program="' + escape('<?xml version="1.0" encoding="UTF-8"?><program dx="' + rnd2(part.dl) + '" dy="' + rnd2(part.dw) + '" dz="' + rnd2(part.thick) + '">' + contXNC + '</program>') + '"><part id="' + part.id + '"/></operation>';
                        contXNC = null;
                    }
                }
                if (cbExpBore.Value || cbExpCut.Value) {
                    if (part.bFront.length > 0 || part.cFront.length > 0) {
                        frontXNC = '<?xml version="1.0" encoding="UTF-8"?><program dx="' + rnd2(part.dl) + '" dy="' + rnd2(part.dw) + '" dz="' + rnd2(part.thick) + '">';
                        if (part.bFront.length > 0)
                            frontXNC += createBoreXNC(part.bFront, part.thick, part);
                        if (part.cFront.length > 0)
                            frontXNC += createCutXNC(part.cFront, part.thick, part, contToolName);
                        if (contXNC != null)
                            frontXNC += contXNC;
                        frontXNC += '</program>';
                        xml += '<operation typeId="XNC" id="' + (operationId++) + '" side="1" bySizeDetail="true" code="' + code + 'x' + partId + 'x1" typeName="' + part.name + '" program="' + escape(frontXNC) + '"><part id="' + part.id + '"/></operation>';
                        part.bExThrough = false;
                        part.cExThrough = false;
                    }
                    if (part.bBack.length > 0 || part.cBack.length > 0) {
                        backXNC = '<?xml version="1.0" encoding="UTF-8"?><program dx="' + rnd2(part.dl) + '" dy="' + rnd2(part.dw) + '" dz="' + rnd2(part.thick) + '">';
                        if (part.bBack.length > 0)
                            backXNC += createBoreXNC(part.bBack, part.thick, part);
                        if (part.cBack.length > 0)
                            backXNC += createCutXNC(part.cBack, part.thick, part, contToolName);
                        backXNC += '</program>';
                        xml += '<operation typeId="XNC" id="' + (operationId++) + '" side="2" bySizeDetail="true" code="' + code + 'x' + partId + 'x2" typeName="' + part.name + '" program="' + escape(backXNC) + '"><part id="' + part.id + '"/></operation>';
                    }
                }
            }
        }
        xml += '</project>';

        /////////////////////////
        time = Date.now() - time;
        system.log("TIME2: " + time);
        try {
            fileName = system.askFileNameSave('project');
        } catch (err) {
            fileName = system.askFileName('project');
        }
        if (fileName == null || fileName == '')
            return;
        if (!fileName.endsWith('.project'))
            fileName += '.project';
        if (system.fileExists(fileName) && !confirm('Файд "' + fileName + '" уже существует! Переписать?'))
            return;
        system.writeTextFile(fileName, xml);
    } catch (err) {
        alert('Воовремя работы скрипта, возникла ошибка: ' + err + '!');
    }
}

function createCutXNC(cuts, thick, part) {

    tools = [];
    sb = '';
    if (part.cExThrough) {
        protrusionCut = parseFloat(tbCutOffset.Value);
        sb = '<var comment="Глубина сквозного фрезерования" name="throughCutDepth" type="double" expr="dz' + (protrusionCut > 0 ? '+' + rnd2(protrusionCut) : '') + '"/>';
    }

    for (bi = 0; bi < cuts.length; bi++) {
        var cut = cuts[bi];
        if (cbGrooveHor.Value || cbGrooveVert.Value) {
            cut.groove = true;
            for (var i = 0; i < cut.path.length; i++) {
                cutElement = cut.path[i];
                if (cutElement.Type != 1 || !(cbGrooveHor.Value && isEqualFloat(cutElement.sy, cutElement.ey) || cbGrooveVert.Value && isEqualFloat(cutElement.sx, cutElement.ex))) {
                    cut.groove = false;
                    break;
                }
            }
        }
        if (!cut.groove && tools.indexOf(cut.diameter) == -1)
            tools.push(cut.diameter);
    }

    //groove
    grooveTool = null;
    for (bi = 0; bi < cuts.length; bi++) {
        var cut = cuts[bi];
        if (cut.groove)
            for (var i = 0; i < cut.path.length; i++) {
                cutElement = cut.path[i];
                if (cutElement.Type == 1) {
                    if (grooveTool == null)
                        grooveTool = 'Cut' + rnd2s(parseFloat(cbGrooveThick.Value));
                    sb += '<gr x1="' + rnd4s(part.offsetX + cutElement.sx) + '" y1="' + rnd4s(part.offsetY + cutElement.sy) + '" x2="' + rnd4s(part.offsetX + cutElement.ex) + '" y2="' + rnd4s(part.offsetY + cutElement.ey) + '" dp="' + (Math.round(thick * 100) > Math.round(cut.dp * 100) ? rnd2s(cut.dp) : 'throughCutDepth') + '" name="' + grooveTool + '" c="' + 0 + '" t="' + rnd4s(cut.diameter) + '" comment="' + cut.name + '"/>';
                }
            }
    }


    for (bi = 0; bi < cuts.length; bi++) {
        var cut = cuts[bi];
        if (cut.groove)
            continue;
        tn = 'Mill' + rnd2s(cut.diameter);

        cc=0;
        for (var i = 0; i < cut.path.length; i++) {
            cutElement = cut.path[i];
             if (cutElement.Type == 3) {
                cc++;
                sb += '<ms x="' + rnd4s(cutElement.cx + cutElement.r) + '" y="' + rnd4s(cutElement.cy) + '" dp="' + (Math.round(thick * 100) > Math.round(cut.dp * 100) ? rnd2s(cut.dp) : 'throughCutDepth') + '" name="' + tn + '" c="' + 0 + '" comment="' + cut.name + '"/>';
                sb += '<mac x="' + rnd4s(cutElement.cx) + '" y="' + rnd4s(cutElement.cy + cutElement.r) + '" cx="' + rnd4s(cutElement.cx) + '" cy="' + rnd4s(cutElement.cy) + '" dir="false"/>';
                sb += '<mac x="' + rnd4s(cutElement.cx + cutElement.r) + '" y="' + rnd4s(cutElement.cy) + '" cx="' + rnd4s(cutElement.cx) + '" cy="' + rnd4s(cutElement.cy) + '" dir="false"/>';
                sb += '<mac x="' + rnd4s(cutElement.cx) + '" y="' + rnd4s(cutElement.cy - cutElement.r) + '" cx="' + rnd4s(cutElement.cx) + '" cy="' + rnd4s(cutElement.cy) + '" dir="false"/>';
            }
        }
        if ((cut.path.length-cc)>0){
        sb += '<ms x="' + rnd4s(cut.path[0].sx) + '" y="' + rnd4s(cut.path[0].sy) + '" dp="' + (Math.round(thick * 100) > Math.round(cut.dp * 100) ? rnd2s(cut.dp) : 'throughCutDepth') + '" name="' + tn + '" c="' + 0 + '" comment="' + cut.name + '"/>';
        for (var i = 0; i < cut.path.length; i++) {
            cutElement = cut.path[i];
            if (cutElement.Type == 1) {
                sb += '<ml x="' + rnd4s(cutElement.ex) + '" y="' + rnd4s(cutElement.ey) + '"/>';
            } else if (cutElement.Type == 2) {
                sb += '<mac x="' + rnd4s(cutElement.ex) + '" y="' + rnd4s(cutElement.ey) + '" cx="' + rnd4s(cutElement.cx) + '" cy="' + rnd4s(cutElement.cy) + '" dir="' + cutElement.dir + '"/>';
            }
        }
          }
    }
    if (grooveTool != null)
        sb = '<tool name="' + grooveTool + '" d="' + rnd2s(parseFloat(cbGrooveThick.Value)) + '"/>' + sb;
    for (ti = 0; ti < tools.length; ti++) {
        tn = 'Mill' + rnd2s(tools[ti]);
        if (tn != contToolName)
            sb = '<tool name="' + tn + '" d="' + rnd2s(tools[ti]) + '"/>' + sb;
    }
    return sb;
}

function createBoreXNC(bores, thick, part, contToolName) {
    tools = [];
    sb = '';
    if (part.bExThrough) {
        protrusionBore = parseFloat(tbBoreOffset.Value);
        sb = '<var comment="Глубина сквозного отверстия" name="throughBoreDepth" type="double" expr="dz' + (protrusionBore > 0 ? '+' + rnd2(protrusionBore) : '') + '"/>';
    }

    for (bi = 0; bi < bores.length; bi++) {
        var bore = bores[bi];
        if (bore.plane < 4 && tools.indexOf(bore.d) == -1)
            tools.push(bore.d);
        m = Math.abs((thick / 2) - bore.z) < 0.01;
        switch (bore.plane) {
            case 0:
                sb += '<bt ver="2" x="' + rnd2s(part.offsetX + bore.x) + '" z="' + rnd2s(bore.z) + '" dp="' + bore.dp + '" m="' + m + '" name="Bore' + rnd2s(bore.d) + '"/>';
                break;
            case 1:
                sb += '<bb  ver="2" x="' + rnd2s(part.offsetX + bore.x) + '" z="' + rnd2s(bore.z) + '" dp="' + bore.dp + '" m="' + m + '" name="Bore' + rnd2s(bore.d) + '"/>';
                break;
            case 2:
                sb += '<bl ver="2" y="' + rnd2s(part.offsetY + bore.y) + '" z="' + rnd2s(bore.z) + '" dp="' + bore.dp + '" m="' + m + '" name="Bore' + rnd2s(bore.d) + '"/>';
                break;
            case 3:
                sb += '<br ver="2" y="' + rnd2s(part.offsetY + bore.y) + '" z="' + rnd2s(bore.z) + '" dp="' + bore.dp + '" m="' + m + '" name="Bore' + rnd2s(bore.d) + '"/>';
                break;
            case 4:
            case 5:
                th = !(Math.round(thick * 10) > Math.round(bore.dp * 10));
                bore.d = th && tbBoreThS.Value ? -bore.d : bore.d;
                if (tools.indexOf(bore.d) == -1)
                    tools.push(bore.d);
                sb += '<bf x="' + rnd2s(part.offsetX + bore.x) + '" y="' + rnd2s(part.offsetY + bore.y) + '" dp="' + (th ? 'throughBoreDepth' : rnd2s(bore.dp)) + '" name="Bore' + (bore.d < 0 ? "Th" : "") + rnd2s(Math.abs(bore.d)) + '"/>';
                break;
        }
    }
    for (ti = 0; ti < tools.length; ti++)
        sb = '<tool name="Bore' + (tools[ti] < 0 ? "Th" : "") + rnd2s(Math.abs(tools[ti])) + '" d="' + rnd2s(Math.abs(tools[ti])) + '"/>' + sb;
    return sb;
}

function sortParts(p1, p2) {
    if (!cbUnion.Value && p1.product.id > p2.product.id)
        return 1;
    if (!cbUnion.Value && p1.product.id < p2.product.id)
        return -1;
    if (p1.ArtPos > p2.ArtPos) return 1;
    if (p1.ArtPos < p2.ArtPos) return -1;
    return 0;
}

function Product(name) {
    this.name = name;
    this.code = null;
    this.objs = [];
    this.parts = [];
    this.furns = [];
    this.bands = [];
};


function OpCutSheet(name, Thickness) {
    this.name = name;
    this.t = Thickness;
    this.parts = [];
};

function OpEdge(Material, Thickness, Width) {
    this.name = Material;
    this.t = Thickness;
    this.w = Width;
    this.parts = [];
}

function Furn(name, unit, price, count) {
    this.name = name;
    this.unit = unit;
    this.price = price;
    this.count = count;
};

function Hole(Position, EndPosition, Direction, obj) {
    this.Position = Position;
    this.EndPosition = EndPosition;
    this.Direction = Direction;
    this.obj = obj;
    this.used = false;
};

function Bore(plane, d, x, y, z, dp) {
    this.plane = plane;
    this.d = d;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dp = dp;
};

function Cut(diameter, depth, offset) {
    this.diameter = diameter;
    this.dp = depth;
    this.offset = offset;
    this.groove = false;
    this.path = [];
};

function addFurn(product, name, unit, price) {
    for (fi = 0; fi < product.furns.length; fi++) {
        var f = product.furns[fi];
        if (name == f.name && unit == f.unit) {
            f.count++;
            return;
        }
    }
    furn = new Furn(name, unit, price, 1);
    product.furns.push(furn);
}

function addEdge(part, Material, Thickness, Width) {
    // system.log("Кромка: "+Material+" Толщина: "+Thickness);
    opEdge = null;
    for (i = 0; i < opEdges.length; i++) {
        var op = opEdges[i];
        if (Material == op.name && Thickness == op.t && Width == op.w) {
            opEdge = op;
            break;
        }
    }
    if (opEdge == null) {
        opEdge = new OpEdge(Material, Thickness, Width);
        opEdge.id = operationId++;
        opEdges.push(opEdge);
    }
    for (i = 0; i < opEdge.parts.length; i++)
        if (opEdge.parts[i] == part)
            return opEdge;
    opEdge.parts.push(part);
    return opEdge;
};


function addBand(product, node) {
    band = null;

    for (i = 0; i < opCutBands.length; i++) {
        var b = opCutBands[i];
        if (node.Name == b.Name) {
            band = b;
            break;
        }
    }
    if (band == null) {
        opCutBands.push(band = node);
        band.bands = [];
    }
    for (i = 0; i < product.bands.length; i++) {
        var part = product.bands[i];
        if (node.ArtPos == part.ArtPos && band.Name == part.band.Name && part.dl == rnd2(node.GSize.z)) {
            part.count += 1;
            return;
        }
    }
    var part = {};
    part.count = 1;
    part.band = band;
    //   printFields(node);
    part.dl = rnd2(node.Thickness);
    band.mw = part.dw = rnd2(node.GSize.x);
    band.mt = part.dt = rnd2(node.GSize.y);
    //system.log(part.dl+"  "+(node.GMax.x-node.GMin.x)+"   "+(node.GMax.y-node.GMin.y));
    //  system.log('dl:'+part.dl+' dw:'+part.dw +' mt:'+ band.mt);
    part.ArtPos = node.ArtPos;
    if (part.ArtPos == null || part.ArtPos == '')
        part.ArtPos = 'X' + (artNum++);

    product.bands.push(part);
    // if (node.Thickness>0)
    band.bands.push(part);
};

function getCount(node) {
    return node['length'] === undefined ? node.Count : node.length;
}

function iterateModelForProduct(node, product) {
    var count = getCount(node);
    for (var i = 0; i < count; i++) {
        child = node[i];
        if (child.constructor.name == 'TFurnBlock') {
            p = new Product(child.Name);
            p.code =(system.apiVersion < 1100 || child.Designation === undefined || child.Designation==null || child.Designation==''||!cbDesignation.Value)? child.ArtPos:child.Designation;
            products.push(p);
            p.objs.push(child);
        } else if (child.constructor.name == 'TLayer3D') {
            iterateModelForProduct(child, product);
        } else if (child.constructor.name != 'TModelLimits') {
            product.objs.push(child);
        }
    }
}

function iterateProductModel(product, node) {

    try {
        if (!node.Visible)
            return;
    } catch (err) {}
    // system.log("  Node1: " + node.constructor.name);
    if (node.constructor.name == 'TFurnBlock' || node.constructor.name == 'TLayer3D' || node.constructor.name == 'TModel3D' || node.constructor.name == 'T3DObjectList' || node.constructor.name == 'TParamBlock3D') {
        var count = getCount(node);
        for (var i = 0; i < count; i++)
            iterateProductModel(product, node[i]);
    } else {
        if (node.constructor.name == 'TFurnPanel') {
            if (node.Bent == false) {
                newPart = createPart(node);
                newPart.product = product;
                for (i = 0; i < product.parts.length; i++) {
                    var part = product.parts[i];

                    if (isEqualPart(part, newPart)) {
                        part.count += 1;
                        return;
                    }
                }
                product.parts.push(newPart);
            }

        } else if (node.constructor.name == 'TFastener') {
            if (node.Name != 'Габарит секции')
                addFurn(product, node.Name, "шт", 0);
        } else if (node.constructor.name == 'TContour3D') {

        } else if (node.constructor.name == 'TFurnAsm') {
            addFurn(product, node.Name, "шт", 0);
        } else if (node.constructor.name == 'TAsmKit') {
            addFurn(product, node.Name, "шт", 0);
        } else if (node.constructor.name == 'TExtrusionBody') {
            if (cbExpProf.Value)
                addBand(product, node)
        } else if (node.constructor.name == 'TModelLimits') {
            //
        } else if (node.constructor.name == 'TAuxLine3D') {
            //
        } else if (node.constructor.name == 'TDraftBlock') {
            //
        } else if (node.constructor.name == 'TObject3D') {
            //
        } else if (node.constructor.name == 'TCustomExtrusionBody') {
            //
        } else if (node.constructor.name == 'TSize3D') {
            //

        } else {
            system.log("  Node: " + node.constructor.name);
        }
    }
}

function isEqualPart(part1, part2) {
    if (part1.ArtPos != part2.ArtPos)
        return false;
    if (part1.name != part2.name)
        return false;
    if (part1.MaterialName != part2.MaterialName)
        return false;
    if (!isEqualFloat(part1.thick, part2.thick))
        return false;
    if (!isEqualFloat(part1.dl, part2.dl))
        return false;
    if (!isEqualFloat(part1.dw, part2.dw))
        return false;
    if (part1.el.length != part2.el.length)
        return false;
    if (part1.bFront.length != part2.bFront.length)
        return false;
    if (part1.bBack.length != part2.bBack.length)
        return false;
    if (part1.cFront.length != part2.cFront.length)
        return false;
    if (part1.cBack.length != part2.cBack.length)
        return false;

    for (var i = 0; i < part1.el.length; i++)
        if (part1.el[i] != part2.el[i])
            return false;
    for (var i = 0; i < part1.bFront.length; i++)
        if (!isEqualBore(part1.bFront[i], part2.bFront[i]))
            return false;
    for (var i = 0; i < part1.bBack.length; i++)
        if (!isEqualBore(part1.bBack[i], part2.bBack[i]))
            return false;
    for (var i = 0; i < part1.cFront.length; i++)
        if (!isEqualCut(part1.cFront[i], part2.cFront[i]))
            return false;

    for (var i = 0; i < part1.cBack.length; i++)
        if (!isEqualCut(part1.cBack[i], part2.cBack[i]))
            return false;
    return true;
}


function isEqualBore(bore1, bore2) {
    if (bore1.plane != bore2.plane)
        return false;
    if (!isEqualFloat(bore1.d, bore2.d))
        return false;
    if (!isEqualFloat(bore1.x, bore2.x))
        return false;
    if (!isEqualFloat(bore1.y, bore2.y))
        return false;
    if (!isEqualFloat(bore1.z, bore2.z))
        return false;
    if (!isEqualFloat(bore1.dp, bore2.dp))
        return false;
    return true;
}

function isEqualCut(cut1, cut2) {
    if (!isEqualFloat(cut1.diameter, cut2.diameter))
        return false;
    if (!isEqualFloat(cut1.dp, cut2.dp))
        return false;
    if (!isEqualFloat(cut1.offset, cut2.offset))
        return false;
    if (cut1.groove != cut2.groove)
        return false;
    if (cut1.path.length != cut2.path.length)
        return false;

    for (var i = 0; i < cut1.path.length; i++) {
        elem1 = cut1.path[i];
        elem2 = cut2.path[i];
        if (elem1.Type != elem2.Type)
            return false;
        if (elem1.ElType == 1) {
            if (!isEqualFloat(elem1.sx, elem2.sx))
                return false;
            if (!isEqualFloat(elem1.sy, elem2.sy))
                return false;
            if (!isEqualFloat(elem1.ex, elem2.ex))
                return false;
            if (!isEqualFloat(elem1.ey, elem2.ey))
                return false;
        } else if (elem1.ElType == 2) {
            if (!isEqualFloat(elem1.sx, elem2.sx))
                return false;
            if (!isEqualFloat(elem1.sy, elem2.sy))
                return false;
            if (!isEqualFloat(elem1.ex, elem2.ex))
                return false;
            if (!isEqualFloat(elem1.ey, elem2.ey))
                return false;
            if (!isEqualFloat(elem1.cx, elem2.cx))
                return false;
            if (!isEqualFloat(elem1.cy, elem2.cy))
                return false;
            if (elem1.dir != elem2.dir)
                return false;
        } else if (elem1.ElType == 3) {
            if (!isEqualFloat(elem1.cx, elem2.cx))
                return false;
            if (!isEqualFloat(elem1.cy, elem2.cy))
                return false;
            if (!isEqualFloat(elem1.r, elem2.r))
                return false;
        }
    }
    return true;
}

function sortBores(b1, b2) {
    r = compare(b1.plane, b2.plane);
    if (r != 0)
        return r;

    r = compare(b1.d, b2.d);
    if (r != 0)
        return r;

    r = compare(b1.x, b2.x);
    if (r != 0)
        return r;
    r = compare(b1.y, b2.y);
    if (r != 0)
        return r;
    r = compare(b1.z, b2.z);
    if (r != 0)
        return r;

    r = compare(b1.dp, b2.dp);
    if (r != 0)
        return r;

    return 0;
}



function compare(v1, v2) {
    if (Math.abs(v1 - v2) < 0.01)
        return 0;
    else
        return v1 > v2 ? 1 : -1;
}

function getButtForLine(node, elem) {
    return elem.Tag === undefined ? elem.Data.Butt : (elem.Tag >= 0 ? node.Butts[elem.Tag] : null);
}

function createPart(node) {
    node.Build();
    //printFields(node);
    //printMethods(node);
    var part = {};
    part.count = 1;
    part.id = null;
    //
    part.name = node.Name;
    part.MaterialName = node.MaterialName;
    part.ArtPos =(system.apiVersion < 1100 || node.Designation === undefined || node.Designation==null || node.Designation==''||!cbDesignation.Value)? node.ArtPos:node.Designation;
    part.thick = node.Thickness;
    part.dl = node.GSize.x;
    part.dw = node.GSize.y;
    part.cl = node.ContourWidth;
    part.cw = node.ContourHeight;
    part.el = [];
    part.bFront = [];
    part.bBack = [];
    part.cFront = [];
    part.cBack = [];
    part.txt = node.TextureOrientation > 0;
    part.bExThrough = false;
    part.cExThrough = false;
    //
    cThrough = [];
    bThrough = [];
    bHor = [];

    for (var j = 0; j < node.Butts.Count; j++)
        if (!node.Butts[j].ClipPanel)
            ClipPanel = true;


    minX = 1000000;
    minY = 1000000;
    maxX = -1000000;
    maxY = -1000000;
    if (node.Contour.Count > 0) {
        for (var i = 0; i < node.Contour.Count; i++) {
            elem = node.Contour[i];
            if (elem.ElType == 1) {
                minX = Math.min(minX, elem.Pos1.x);
                minY = Math.min(minY, elem.Pos1.y);
                maxX = Math.max(maxX, elem.Pos1.x);
                maxY = Math.max(maxY, elem.Pos1.y);
                minX = Math.min(minX, elem.Pos2.x);
                minY = Math.min(minY, elem.Pos2.y);
                maxX = Math.max(maxX, elem.Pos2.x);
                maxY = Math.max(maxY, elem.Pos2.y);
            } else if (elem.ElType == 2) {

                if (elem.AngleOnArc(Math.PI) == true) {
                    minX = Math.min(minX, elem.Center.x - elem.ArcRadius());
                } else {
                    minX = Math.min(minX, elem.Pos1.x);
                    minX = Math.min(minX, elem.Pos2.x);
                }

                if (elem.AngleOnArc(0) || elem.AngleOnArc(Math.PI * 2.0)) {
                    maxX = Math.max(maxX, elem.Center.x + elem.ArcRadius());
                } else {
                    maxX = Math.max(maxX, elem.Pos1.x);
                    maxX = Math.max(maxX, elem.Pos2.x);
                }
                if (elem.AngleOnArc((Math.PI * 3.0) / 2.0)) {
                    minY = Math.min(minY, elem.Center.y - elem.ArcRadius());
                } else {
                    minY = Math.min(minY, elem.Pos1.y);
                    minY = Math.min(minY, elem.Pos2.y);
                }
                if (elem.AngleOnArc(Math.PI / 2.0)) {
                    maxY = Math.max(maxY, elem.Center.y + elem.ArcRadius());
                } else {
                    maxY = Math.max(maxY, elem.Pos1.y);
                    maxY = Math.max(maxY, elem.Pos2.y);
                }
            } else if (elem.ElType == 3) {
                minX = Math.min(minX, elem.Center.x - elem.CirRadius);
                minY = Math.min(minY, elem.Center.y - elem.CirRadius);
                maxX = Math.max(maxX, elem.Center.x + elem.CirRadius);
                maxY = Math.max(maxY, elem.Center.y + elem.CirRadius);
            }
        }
    } else {
        minX = node.GMin.x;
        minY = node.GMin.y;
        maxX = node.GMax.x;
        maxY = node.GMax.y;

    }

    part.offsetX = minX - node.GMin.x;
    part.offsetY = part.dw - (part.cw + (minY - node.GMin.y));
    part.contour = [];


    if (node.Contour.Count > 0) {
        //Разбиваем общий контур на составляющие
        srcContour = node.Contour.MakeCopy();
        for (var j = 0; j < srcContour.Count; j++)
            srcContour[j].Tag = -1;
        for (var j = 0; j < node.Butts.Count; j++) {
            srcContour[node.Butts[j].ElemIndex].Tag = j;
        }
        //Отделяем окружности
        dstContours = [];
        var contourClear = srcContour.MakeCopy();
        contourClear.Clear();
        for (var j = 0; j < srcContour.Count; j++) {
            if (srcContour[j].ElType == 3) {
                contourItem = contourClear.MakeCopy();
                contourItem.Add(srcContour[j]);
                dstContours.push(contourItem.MakeCopy());
                srcContour.Delete(srcContour[j]);
                j--;
            }
        }

        //Отделяем не связанные контуры
        if (srcContour.Count > 0) {
            srcContour.OrderContours();
            while (srcContour.Count > 0) {
                elem1 = srcContour[srcContour.Count - 1].MakeCopy();
                srcContour.Delete(srcContour[srcContour.Count - 1]);
                contourItem = contourClear.MakeCopy();
                contourItem.Add(elem1);
                dstContours.push(contourItem);
                start: for (var k = 0; k < contourItem.Count; k++) {
                    elem2 = contourItem[k];
                    for (var j = 0; j < srcContour.Count; j++) {
                        elem1 = srcContour[j].MakeCopy();
                        if (isEqualFloat(elem1.Pos2.x, elem2.Pos1.x) && isEqualFloat(elem1.Pos2.y, elem2.Pos1.y) ||
                            isEqualFloat(elem1.Pos1.x, elem2.Pos2.x) && isEqualFloat(elem1.Pos1.y, elem2.Pos2.y) || isEqualFloat(elem1.Pos1.x, elem2.Pos1.x) && isEqualFloat(elem1.Pos1.y, elem2.Pos1.y) ||
                            isEqualFloat(elem1.Pos2.x, elem2.Pos2.x) && isEqualFloat(elem1.Pos2.y, elem2.Pos2.y)
                        ) {
                            contourItem.Add(elem1);
                            srcContour.Delete(srcContour[j]);
                            continue start;
                        }
                    }
                }
            }
        }

        for (var jc = 0; jc < dstContours.length; jc++) {
            contourItem = dstContours[jc];
            contourItem.OrderContours();
            contourItem.clockOtherWise = false;
            //printMethods(contourItem);

            for (var ic = 0; ic < dstContours.length; ic++)
                if (ic != jc) {
                    var p = contourItem[0].ElType == 3 ? contourItem[0].Center : contourItem[0].Pos1;
                    contourItem.clockOtherWise = contourItem.clockOtherWise || (contourItem.IsInContour === undefined ? dstContours[ic].IsPointInside(p, 0, true) : contourItem.IsInContour(dstContours[ic]));
                }
            if (contourItem.IsClosedContour() && contourItem.IsClockOtherWise())
                contourItem.InvertDirection();

            var contElement = {};
            var cntRect = 0;
            //
            var cntr = [];

            for (var j = 0; j < contourItem.Count; j++)
                cntr.push(contourItem[j]);
            //
            var elCan = [];
            elCan[0] = true;
            elCan[1] = true;
            elCan[2] = true;
            elCan[3] = true;
            for (var j = 0; j < cntr.length; j++) {
                elem = cntr[j];
                butt = getButtForLine(node, elem);
                var contourLen = elem.ObjLength();
                if (elem.ElType == 1) {
                    if (rnd1(elem.Pos1.x - minX) == 0 && rnd1(elem.Pos2.x - minX) == 0 && rnd1(contourLen - part.cw) == 0) {
                        cntRect++;
                        if (butt != null)
                            part.el[2] = addEdge(part, butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                        elCan[2] = false;
                    } else if (rnd1(elem.Pos1.y - maxY) == 0 && rnd1(elem.Pos2.y - maxY) == 0 && rnd1(contourLen - part.cl) == 0) {
                        cntRect++;
                        if (butt != null)
                            part.el[0] = addEdge(part, butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                        elCan[0] = false;
                    } else if (rnd1(elem.Pos1.x - maxX) == 0 && rnd1(elem.Pos2.x - maxX) == 0 && rnd1(contourLen - part.cw) == 0) {
                        cntRect++;
                        if (butt != null)
                            part.el[3] = addEdge(part, butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                        elCan[3] = false;
                    } else if (rnd1(elem.Pos1.y - minY) == 0 && rnd1(elem.Pos2.y - minY) == 0 && rnd1(contourLen - part.cl) == 0) {
                        cntRect++;
                        if (butt != null)
                            part.el[1] = addEdge(part, butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                        elCan[1] = false;
                    }
                }
            }
            for (var j = 0; j < cntr.length; j++) {
                elem = cntr[j];
                if (elem == null || elem.ElType > 1)
                    continue;
                butt = getButtForLine(node, elem);
                if (butt != null) {
                    if (part.el[2] == null && (rnd1(elem.Pos1.x - minX) == 0 && rnd1(elem.Pos2.x - minX) == 0)) {
                        part.el[2] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                    } else
                    if (part.el[0] == null && (rnd1(elem.Pos1.y - maxY) == 0 && rnd1(elem.Pos2.y - maxY) == 0)) {
                        part.el[0] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                    } else
                    if (part.el[3] == null && (rnd1(elem.Pos1.x - maxX) == 0 && rnd1(elem.Pos2.x - maxX) == 0)) {
                        part.el[3] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                    } else
                    if (part.el[1] == null && (rnd1(elem.Pos1.y - minY) == 0 && rnd1(elem.Pos2.y - minY) == 0)) {
                        part.el[1] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        cntr[j] = null;
                    }
                }
            }


            for (var j = 0; j < cntr.length; j++) {
                elem = cntr[j];
                if (elem == null)
                    continue;
                butt = getButtForLine(node, elem);
                if (butt != null) {
                    if (elem.ElType == 1) {
                        //!!!
                        if (part.el[2] == null && elCan[2] && (rnd1(elem.Pos1.x - minX) == 0 || rnd1(elem.Pos2.x - minX) == 0))
                            part.el[2] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[0] == null && elCan[0] && (rnd1(elem.Pos1.y - maxY) == 0 || rnd1(elem.Pos2.y - maxY) == 0))
                            part.el[0] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[3] == null && elCan[3] && (rnd1(elem.Pos1.x - maxX) == 0 || rnd1(elem.Pos2.x - maxX) == 0))
                            part.el[3] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[1] == null && elCan[1] && (rnd1(elem.Pos1.y - minY) == 0 || rnd1(elem.Pos2.y - minY) == 0))
                            part.el[1] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                    } else if (elem.ElType == 2) {
                        var r = getDistance(elem.Pos1.x, elem.Pos1.y, elem.Center.x, elem.Center.y);
                        if (part.el[2] == null && elCan[2] && (rnd1(elem.Pos1.x - minX) == 0 || rnd1(elem.Pos2.x - minX) == 0 || Math.abs(rnd1((elem.Center.x - r) - minX)) < 3))
                            part.el[2] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[0] == null && elCan[0] && (rnd1(elem.Pos1.y - maxY) == 0 || rnd1(elem.Pos2.y - maxY) == 0 || Math.abs(rnd1((elem.Center.y + r) - maxY)) < 3))
                            part.el[0] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[3] == null && elCan[3] && (rnd1(elem.Pos1.x - maxX) == 0 || rnd1(elem.Pos2.x - maxX) == 0 || Math.abs(rnd1((elem.Center.x + r) - maxX)) < 3))
                            part.el[3] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        if (part.el[1] == null && elCan[1] && (rnd1(elem.Pos1.y - minY) == 0 || rnd1(elem.Pos2.y - minY) == 0 || Math.abs(rnd1((elem.Center.y - r) - minY)) < 3))
                            part.el[1] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                    } else if (elem.ElType == 3) {
                        part.el[0] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        part.el[1] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        part.el[2] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                        part.el[3] = addEdge(part, '!СмЧт ' + butt.Material, butt.Thickness, butt.Width);
                    }
                }
            }

            if (cntRect < 4) {
                var contour = {};
                contour.path = [];
                part.contour.push(contour);
                contour.clockOtherWise = contourItem.clockOtherWise;
                contour.inner = contourItem.clockOtherWise;
                for (var j = 0; j < contourItem.Count; j++) {
                    var elem = contourItem[j];
                    if (elem.ElType != 3 && rnd1(elem.Pos1.x - elem.Pos2.x) == 0 && rnd1(elem.Pos1.y - elem.Pos2.y) == 0)
                        continue;
                    var contElement = {};
                    contElement.line = false;
                    contElement.Type = elem.ElType;
                    contElement.lineSideFull = false;
                    var contourLen = elem.ObjLength();

                    if (elem.ElType == 1) {
                        contElement.sx = elem.Pos1.x - minX;
                        contElement.sy = elem.Pos1.y - minY;
                        contElement.ex = elem.Pos2.x - minX;
                        contElement.ey = elem.Pos2.y - minY;
                        //Left Right
                        if (rnd1(contElement.sx) == 0 && rnd1(contElement.ex) == 0 || rnd1(elem.Pos1.x - maxX) == 0 && rnd1(elem.Pos2.x - maxX) == 0) {
                            contElement.lineSide = true;
                            contElement.lineSideFull = rnd1(contourLen - part.cw) == 0;
                        }
                        //Top Bottom
                        if (rnd1(elem.Pos1.y - maxY) == 0 && rnd1(elem.Pos2.y - maxY) == 0 || rnd1(contElement.sy) == 0 && rnd1(contElement.ey) == 0) {
                            contElement.lineSide = true;
                            contElement.lineSideFull = rnd1(contourLen - part.cl) == 0;
                        }
                        contElement.sy = part.cw - contElement.sy;
                        contElement.ey = part.cw - contElement.ey;
                        contour.path.push(contElement);
                    } else if (elem.ElType == 2) {
                        contElement.cx = elem.Center.x - minX;
                        contElement.cy = part.cw - (elem.Center.y - minY);
                        contElement.sx = elem.Pos1.x - minX;
                        contElement.sy = part.cw - (elem.Pos1.y - minY);
                        contElement.sa = (elem.Pos1Angle() * 180.0) / Math.PI;
                        contElement.ex = elem.Pos2.x - minX;
                        contElement.ey = part.cw - (elem.Pos2.y - minY);
                        contElement.ea = (elem.Pos2Angle() * 180.0) / Math.PI;
                        contElement.r = elem.ArcRadius();
                        contElement.dir = !elem.ArcDir;
                        contour.path.push(contElement);
                    } else if (elem.ElType == 3) {
                        contElement.cx = elem.Center.x - minX;
                        contElement.cy = part.cw - (elem.Center.y - minY);
                        contElement.r = elem.CirRadius;
                        contElement.dir = false;
                        contour.path.push(contElement);
                    } else {
                        alert('Неизвестный элемент контура: ' + elem.ElType + "  у детали (" + part.ArtPos + ") " + part.name);
                    }
                }

            }
        }
    }

    if (cbExpCut.Value && node.Cuts != undefined && node.Cuts.Count > 0) {
        for (var i = 0; i < node.Cuts.Count; i++) {
            nodeCut = node.Cuts[i];
            if (nodeCut.Trajectory == undefined && nodeCut.Trajectory.Count == 0)
                continue;
            grooveRect = 0;
            for (var j = 0; j < nodeCut.Contour.Count; j++) {
                var elem = nodeCut.Contour[j];
                if (elem.ElType != 1) {
                    grooveRect = 1;
                    break;
                }
                if (elem.ElType == 1 && !(isEqualFloat(elem.Pos1.x, elem.Pos2.x) || isEqualFloat(elem.Pos1.y, elem.Pos2.y))) {
                    grooveRect = 2;
                    break;
                }
            }
            if (grooveRect > 0) {
                if (grooveRectMsg) {
                    alert('В GibLab будет перенесено только паз с прямолинейным профилем (' + grooveRect + ')! Смотри деталь: ' + node.ArtPos + '-' + node.Name);
                    grooveRectMsg = false;
                }
                continue;
            }
            depth = nodeCut.Contour.Height; //nodeCut.Contour.Max.y - nodeCut.Contour.Min.y;
            width = nodeCut.Contour.Width; //nodeCut.Contour.Max.x - nodeCut.Contour.Min.x
            cMinX = 1000000000;
            cMaxX = -cMinX;
            cMinY = 1000000000;
            cMaxY = -cMinY;
            if (nodeCut.Contour.Max == undefined) {
                for (var j = 0; j < nodeCut.Contour.Count; j++) {
                    var elem = nodeCut.Contour[j];
                    if (elem.ElType == 1 || elem.ElType == 2) {
                        if (cMinX > elem.Pos1.x)
                            cMinX = elem.Pos1.x;
                        else if (cMaxX < elem.Pos1.x)
                            cMaxX = elem.Pos1.x;
                        if (cMinY > elem.Pos1.y)
                            cMinY = elem.Pos1.y;
                        else if (cMaxY < elem.Pos1.y)
                            cMaxY = elem.Pos1.y;
                        if (cMinX > elem.Pos2.x)
                            cMinX = elem.Pos2.x;
                        else if (cMaxX < elem.Pos2.x)
                            cMaxX = elem.Pos2.x;
                        if (cMinY > elem.Pos2.y)
                            cMinY = elem.Pos2.y;
                        else if (cMaxY < elem.Pos2.y)
                            cMaxY = elem.Pos2.y;
                    } else if (elem.ElType == 3) {
                        if (cMinX > (elem.Center.x - elem.CirRadius))
                            cMinX = elem.Center.x - elem.CirRadius;
                        else if (cMaxX < (elem.Center.x + elem.CirRadius))
                            cMaxX = elem.Center.x + elem.CirRadius;
                        if (cMinY > (elem.Center.y - elem.CirRadius))
                            cMinY = elem.Center.y - elem.CirRadius;
                        else if (cMaxY < (elem.Center.y + elem.CirRadius))
                            cMaxY = elem.Center.y + elem.CirRadius;
                    } else {
                        alert('Неизвестный элемент траектории: ' + elem.ElType + "  у детали (" + part.ArtPos + ") " + part.name);
                    }
                }
            } else {
                cMinX = nodeCut.Contour.Min.x;
                cMaxX = nodeCut.Contour.Max.x;
                cMinY = nodeCut.Contour.Min.y;
                cMaxY = nodeCut.Contour.Max.y;
            }

            var cut = new Cut(width, depth, (cMaxX + cMinX) / 2.0);
            cut.name = nodeCut.Name + ' (' + nodeCut.Sign + ')';
            //system.log("depth="+depth+"  "+cMinY+"   "+cMaxY);
            if (cMinY <= 0.01 && cMaxY >= (part.thick - 0.01)) {
                cThrough.push(cut);
                //system.log("cThrough diameter:" + cut.diameter + " depth:" + cut.depth + " offset:" + cut.offset);
            } else if (cMaxY >= (part.thick - 0.01)) {
                part.cFront.push(cut);
                // system.log("cBack diameter:" + cut.diameter + " depth:" + cut.depth + " offset:" + cut.offset);
            } else if (cMinY <= 0.01) {
                part.cBack.push(cut);
                // system.log("cFront diameter:" + cut.diameter + " depth:" + cut.depth + " offset:" + cut.offset);
            }
            for (var j = 0; j < nodeCut.Trajectory.Count; j++) {
                var elem = nodeCut.Trajectory[j];
                if (elem.ElType != 3 && rnd1(elem.Pos1.x - elem.Pos2.x) == 0 && rnd1(elem.Pos1.y - elem.Pos2.y) == 0)
                    continue;
                var cutElement = {};
                cutElement.Type = elem.ElType;
                if (elem.ElType == 1) {
                    cutElement.sx = elem.Pos1.x - minX;
                    cutElement.sy = elem.Pos1.y - minY;
                    cutElement.ex = elem.Pos2.x - minX;
                    cutElement.ey = elem.Pos2.y - minY;
                    a = Math.atan2(cutElement.sy - cutElement.ey, cutElement.sx - cutElement.ex) - Math.PI / 2.0;
                    cutElement.sx += cut.offset * Math.cos(a),
                    cutElement.sy += cut.offset * Math.sin(a);
                    cutElement.ex += cut.offset * Math.cos(a),
                    cutElement.ey += cut.offset * Math.sin(a);
                    cutElement.sy = part.cw - cutElement.sy;
                    cutElement.ey = part.cw - cutElement.ey;
                    cut.path.push(cutElement);
                } else if (elem.ElType == 2) {
                    if (rnd1(cut.offset) != 0) {
                        alert('Требуется доработка пазования! Просьба - отправить проект B3D на gibadulin@gmail.com, проблема с пазом у детали (' + part.ArtPos + ')');
                        cut.path = [];
                        break;
                    }
                    cutElement.cx = elem.Center.x - minX;
                    cutElement.cy = part.cw - (elem.Center.y - minY);
                    cutElement.sx = elem.Pos1.x - minX;
                    cutElement.sy = part.cw - (elem.Pos1.y - minY);
                    cutElement.sa = (elem.Pos1Angle() * 180.0) / Math.PI;
                    cutElement.ex = elem.Pos2.x - minX;
                    cutElement.ey = part.cw - (elem.Pos2.y - minY);
                    cutElement.ea = (elem.Pos2Angle() * 180.0) / Math.PI;
                    cutElement.r = elem.ArcRadius() + cut.offset;
                    cutElement.dir = !elem.ArcDir;
                    cut.path.push(cutElement);
                } else if (elem.ElType == 3) {
                    cutElement.cx = elem.Center.x - minX;
                    cutElement.cy = part.cw - (elem.Center.y - minY);
                    cutElement.r = elem.CirRadius + cut.offset;
                    cut.path.push(cutElement);
                } else {
                    alert('Неизвестный элемент траектории паза: ' + elem.ElType + "  у детали (" + part.ArtPos + ") " + part.name);
                }
            }
        }
    }
    if (tbExpBoreThick.Value < part.thick) {
        var n = 0;
        for (var i = 0; i < holes.length; i++) {
            hole = holes[i];
            if (hole.used)
                continue;
            holePos = node.GlobalToObject(hole.Position);
            if (holePos.z < -(hole.obj.Depth + node.Thickness) || (holePos.z > hole.obj.Depth + node.Thickness))
                continue;
            holeDir = node.NToObject(hole.Direction);

            if (rnd2(Math.abs(holeDir.z)) == 1 && node.Contour.IsPointInside(holePos)) {
                hz = holePos.z;
                if (holeDir.z > 0.01) {
                    if (hz <= 0.01 && (hz + hole.obj.Depth) > 0) {
                        depth = hz + hole.obj.Depth;
                        // system.log("N:"+     part.name+"  D:"+depth+"  "+hz);
                        b = new Bore(5, hole.obj.Diameter, holePos.x - minX, part.cw - holePos.y + minY, 0, rnd2(depth));
                        if (Math.round(part.thick * 10) > Math.round(b.dp * 10))
                            part.bBack.push(b);
                        else {
                            bThrough.push(b);
                        }
                        hole.used = isEqualFloat(hz, 0) && (node.Thickness >= hole.obj.Depth);

                    }
                    continue;
                } else {
                    //system.log("B:"+node.Name+"   "+hz+"  "+node.Thickness+"    "+hole.obj.Depth+" "+((hz-node.Thickness)>=0) +"  "+( hole.obj.Depth-(hz-node.Thickness)));
                    depth = hole.obj.Depth - (hz - node.Thickness);
                    if ((hz - node.Thickness) >= -0.01 && depth >= 0.01) {
                        b = new Bore(4, hole.obj.Diameter, holePos.x - minX, part.cw - holePos.y + minY, 0, rnd2(depth));
                        if (Math.round(part.thick * 10) > Math.round(b.dp * 10))
                            part.bFront.push(b);
                        else
                            bThrough.push(b);
                        hole.used = isEqualFloat(hz, node.Thickness) && (node.Thickness >= hole.obj.Depth);
                    }
                    continue;
                }
            }
            if (rnd2(holeDir.z) != 0 || holePos.z <= 0 || holePos.z >= node.Thickness)
                continue;
            holeEndPos = node.GlobalToObject(hole.EndPosition);
            if (node.Contour.IsPointInside(holeEndPos)) {
                hdx = rnd2(holeDir.x);
                hdy = rnd2(holeDir.y);
                holeEndPos = node.GlobalToObject(hole.EndPosition);
                for (var j = 0; j < node.Contour.Count; j++) {
                    contour = node.Contour[j];
                    contourButt = contour.Data != null && contour.Data.Butt != null ? contour.Data.Butt : null;
                    var bt = (contourButt != undefined && contourButt != null && !contourButt.ClipPanel) ? contourButt.Thickness : 0;
                    if ((rnd2(contour.DistanceToPoint(holePos) + contour.DistanceToPoint(holeEndPos)) == rnd2(hole.obj.Depth) && (rnd2(contour.DistanceToPoint(holeEndPos) + bt) > 2))) {
                        dp = rnd2(contour.DistanceToPoint(holeEndPos) + bt);
                        if (hdx == 1) {
                            bHor.push(new Bore(2, hole.obj.Diameter, 0, part.cw - holePos.y + minY, part.thick - holePos.z, dp));
                            hole.used = isEqualFloat(dp, hole.obj.Depth);
                            break;
                        } else if (hdx == -1) {
                            bHor.push(new Bore(3, hole.obj.Diameter, 0, part.cw - holePos.y + minY, part.thick - holePos.z, dp));
                            hole.used = isEqualFloat(dp, hole.obj.Depth);;
                            break;
                        } else if (hdx == 0) {
                            if (hdy == 1) {
                                bHor.push(new Bore(1, hole.obj.Diameter, holePos.x - minX, 0, part.thick - holePos.z, dp));
                            } else if (hdy == -1) {
                                bHor.push(new Bore(0, hole.obj.Diameter, holePos.x - minX, 0, part.thick - holePos.z, dp));
                            }
                            hole.used = isEqualFloat(dp, hole.obj.Depth);
                            break;
                        }
                    }
                }
            }
        }
        if (part.bFront.length == 0 && part.cFront.length == 0 && (part.bBack.length > 0 || part.cBack.length > 0)) {
            part.offsetX = part.dl - (part.cl + (minX - node.GMin.x));
            te = part.el[2];
            part.el[2] = part.el[3];
            part.el[3] = te;
            //bore
            part.bFront = part.bFront.concat(part.bBack);
            if (bThrough.length > 0)
                part.bFront = part.bFront.concat(bThrough);
            if (bHor.length > 0)
                part.bFront = part.bFront.concat(bHor);
            part.bBack = [];
            //cut
            part.cFront = part.cFront.concat(part.cBack);
            if (cThrough.length > 0)
                part.cFront = part.cFront.concat(cThrough);
            part.cBack = [];
            //
            for (bi = 0; bi < part.bFront.length; bi++) {
                var bore = part.bFront[bi];
                switch (bore.plane) {
                    case 0:
                    case 1:
                        bore.x = part.cl - bore.x;
                        bore.z = part.thick - bore.z;
                        break;
                    case 2:
                        bore.plane = 3;
                        bore.z = part.thick - bore.z;
                        break;
                    case 3:
                        bore.plane = 2;
                        bore.z = part.thick - bore.z;
                        break;
                    case 4:
                    case 5:
                        bore.x = part.cl - bore.x;
                        break;
                }
            }
            for (ci = 0; ci < part.cFront.length; ci++) {
                var cut = part.cFront[ci];
                cut.offset = -cut.offset;
                for (var i = 0; i < cut.path.length; i++) {
                    elem = cut.path[i];
                    if (elem.Type == 1) {
                        elem.sx = part.cl - elem.sx;
                        elem.ex = part.cl - elem.ex;
                    } else if (elem.Type == 2) {
                        elem.sx = part.cl - elem.sx;
                        elem.ex = part.cl - elem.ex;
                        elem.cx = part.cl - elem.cx;
                        elem.dir = !elem.dir;
                    } else if (elem.Type == 3) {
                        elem.cx = part.cl - elem.cx;
                    }
                }
            }
            for (var j = 0; j < part.contour.length; j++) {
                contour = part.contour[j];
                if (contour.path[0].Type != 3)
                    contour.clockOtherWise = !contour.clockOtherWise;
                for (var i = 0; i < contour.path.length; i++) {
                    contElement = contour.path[i];
                    if (contElement.Type == 1) {
                        contElement.sx = part.cl - contElement.sx;
                        contElement.ex = part.cl - contElement.ex;
                    } else if (contElement.Type == 2) {
                        contElement.sx = part.cl - contElement.sx;
                        contElement.ex = part.cl - contElement.ex;
                        contElement.cx = part.cl - contElement.cx;
                        contElement.dir = !contElement.dir;
                    } else if (contElement.Type == 3) {
                        contElement.cx = part.cl - contElement.cx;
                    }
                }
            }
        } else if (bThrough.length > 0 || bHor.length > 0 || cThrough.length > 0) {
            part.bFront = part.bFront.concat(bThrough, bHor);
            part.cFront = part.cFront.concat(cThrough);
        }

        part.bExThrough = bThrough.length > 0;
        part.cExThrough = cThrough.length > 0;
        part.bFront.sort(sortBores);
        part.bBack.sort(sortBores);
    }


    //////////////////////////////////
    //Rotate 90
    //////////////////////////////////
    if (node.TextureOrientation == 2 || node.TextureOrientation == 0 && part.cw > part.cl) {
        // system.log("Rotate:"+part.ArtPos);
        dl = part.dl;
        part.dl = part.dw;
        part.dw = dl;
        cl = part.cl;
        part.cl = part.cw;
        part.cw = cl;
        offsetX = part.offsetX;
        part.offsetX = part.dl - (part.cl + part.offsetY);
        part.offsetY = offsetX; //part.dw-(part.cw+offsetX)
        et = part.el[0];
        eb = part.el[1];
        el = part.el[2];
        er = part.el[3];
        part.el[0] = el;
        part.el[1] = er;
        part.el[2] = eb;
        part.el[3] = et;
        if (cbExpBore.Value && (part.bFront.length > 0 || part.bBack.length > 0)) {
            bores = part.bFront.concat(part.bBack);
            for (bbi = 0; bbi < bores.length; bbi++) {
                var bore = bores[bbi];
                switch (bore.plane) {
                    case 0:
                        bore.plane = 3;
                        bore.y = bore.x;
                        break;
                    case 1:
                        bore.plane = 2;
                        bore.y = bore.x;
                        break;
                    case 2:
                        bore.plane = 0;
                        bore.x = part.cl - bore.y;
                        break;
                    case 3:
                        bore.plane = 1;
                        bore.x = part.cl - bore.y;
                        break;
                    case 4:
                    case 5:
                        ty = bore.y;
                        bore.y = bore.x;
                        bore.x = part.cl - ty;
                        break;
                }
            }
        }

        for (ci = 0; ci < part.cFront.length; ci++) {
            var cut = part.cFront[ci];
            cut.offset = -cut.offset;
            rotatePath90(part, cut.path);
        }
        for (ci = 0; ci < part.cBack.length; ci++) {
            var cut = part.cBack[ci];
            cut.offset = -cut.offset;
            rotatePath90(part, cut.path);
        }
        for (var j = 0; j < part.contour.length; j++) {
            contour = part.contour[j];
            rotatePath90(part, contour.path);
        }
    }

    for (i = 0; i < opCutSheets.length; i++) {
        var ocs = opCutSheets[i];
        if (node.MaterialName == ocs.name && node.Thickness == ocs.t) {
            ocs.parts.push(part);
            return part;
        }
    }
    opCutSheet = new OpCutSheet(node.MaterialName, node.Thickness);
    opCutSheets.push(opCutSheet);
    opCutSheet.parts.push(part);

    return part;
}

function rotatePath90(part, path) {
    for (var i = 0; i < path.length; i++) {
        contElement = path[i];
        if (contElement.Type == 1) {
            ty = contElement.sy;
            contElement.sy = contElement.sx;
            contElement.sx = part.cl - ty;
            ty = contElement.ey;
            contElement.ey = contElement.ex;
            contElement.ex = part.cl - ty;
        } else if (contElement.Type == 2) {
            ty = contElement.sy;
            contElement.sy = contElement.sx;
            contElement.sx = part.cl - ty;
            ty = contElement.ey;
            contElement.ey = contElement.ex;
            contElement.ex = part.cl - ty;
            ty = contElement.cy;
            contElement.cy = contElement.cx;
            contElement.cx = part.cl - ty;
        } else if (contElement.Type == 3) {
            contElement.dir = true;
            ty = contElement.cy;
            contElement.cy = contElement.cx;
            contElement.cx = part.cl - ty;
        }
    }
}

function round2(val) {
    return Math.round(val * 100.0) / 100.0;
}

function round1(val) {
    return Math.round(val * 10.0) / 10.0;
}

function rnd2(val) {
    result = parseFloat(val).toFixed(2);
    if (result == -0)
        result = 0;
    return result;
}


function rnd1(val) {
    return parseFloat(val).toFixed(1);
}

function rnd(val, precision) {
    return parseFloat(val).toFixed(precision);
}


function rnd2s(val) {
    return parseFloat(val).toFixed(2).replace(/\.?0*$/, '')
}

function rnd4s(val) {
    return parseFloat(val).toFixed(4).replace(/\.?0*$/, '')
}

function printFields(obj) {
    if (system.apiVersion >= 1100) {
        var out='';
        for (var key in obj) {
            try {
                out+=(key + "-> " + obj[key]+'\n');
            } catch (err) {
                out+=(key + "-> ERROR\n");
            }
        }
        alert(obj.Name+'\n'+out);
    } else {
        var fields = Object.getOwnPropertyNames(obj).filter(function(p) {
            try {
                return typeof obj['' + p] !== 'function';
            } catch (err) {
                return true;
            }
        });
        for (i = 0; i < fields.length; i++) {
            var key = '' + fields[i];
            try {
                system.log(fields[i] + "-> " + obj[key]);
            } catch (err) {
                system.log(fields[i] + "-> ERROR");
            }
        }
    }
}


function printMethods(obj) {
    var methods = Object.getOwnPropertyNames(obj).filter(function(p) {
        try {
            return typeof obj['' + p] === 'function';
        } catch (err) {
            return true;
        }
    });
    for (i = 0; i < methods.length; i++) {
        system.log("methods: " + methods[i]);
    }
}


if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function(searchString, position) {
            var subjectString = this.toString();
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        }
    });
}


function getModelName() {
    return Action.Control.Owner.Controls[0].Article.Name;
}

function getModelCode() {
    try {
        return Action.Control.Owner.Controls[0].Article.Code;;
    } catch (err) {
        return null;
    }
}
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

function escape(string) {
    return String(string).replace(/[&<>"'\/]/g, function(s) {
        return entityMap[s];
    });
}

function isEqualFloat(v1, v2) {
    return Math.abs(v1 - v2) < 0.01;
}

function isEqualFloat1(v1, v2) {
    return Math.abs(v1 - v2) < 0.1;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function lineArcIntersects(x, y, x1, y1, x2, y2, cx, cy, radius) {
    baX = x2 - x1;
    baY = y2 - y1;
    caX = cx - x1;
    caY = cy - y1;
    a = baX * baX + baY * baY;
    bBy2 = baX * caX + baY * caY;
    c = caX * caX + caY * caY - radius * radius;
    pBy2 = bBy2 / a;
    q = c / a;
    disc = pBy2 * pBy2 - q;
    if (disc < 0)
        return null;
    tmpSqrt = Math.sqrt(disc);
    abScalingFactor1 = -pBy2 + tmpSqrt;
    abScalingFactor2 = -pBy2 - tmpSqrt;
    p1 = [x1 - baX * abScalingFactor1, y1 - baY * abScalingFactor1];
    if (disc == 0) {
        return p1;
    }
    p2 = [x1 - baX * abScalingFactor2, y1 - baY * abScalingFactor2];
    return getDistance(x, y, p1[0], p1[1]) < getDistance(x, y, p2[0], p2[1]) ? p1 : p2;
}

function arcBorderIntersects(x, y, d, dl, dw, cx, cy, radius) {
    p = [];
    p[0] = lineArcIntersects(x, y, -d, -d, dl + d, -d, cx, cy, radius);
    p[1] = lineArcIntersects(x, y, -d, dw + d, dl + d, dw + d, cx, cy, radius);
    p[2] = lineArcIntersects(x, y, -d, -d, -d, dw + d, cx, cy, radius);
    p[3] = lineArcIntersects(x, y, dl + d, -d, dl + d, dw + d, cx, cy, radius);
    mp = null;
    for (var i = 0; i < p.length; i++) {
        if (p[i] == null)
            continue;
        if (!isCorner(x, y, dl, dw) && (x < 5 && p[i][0] > x || x > (dl - 5) && p[i][0] < x || y < 5 && p[i][1] > y || y > (dw - 5) && p[i][1] < y))
            continue;
        if (mp == null || getDistance(x, y, mp[0], mp[1]) > getDistance(x, y, p[i][0], p[i][1]))
            mp = p[i];
    }
    return mp;
}

function isCorner(x, y, dl, dw) {
    return isEqualFloat1(x, 0) && isEqualFloat1(y, 0) || isEqualFloat1(x, 0) && isEqualFloat1(y, dw) || isEqualFloat1(x, dl) && isEqualFloat1(y, dw) || isEqualFloat1(x, dl) && isEqualFloat1(y, 0);
}

function isSide(x, y, dl, dw) {
    return isEqualFloat1(x, 0) || isEqualFloat1(y, 0) || isEqualFloat1(dl, x) || isEqualFloat1(dw, y);
}



function getDistToBorder(x, y, dl, dw, d) {
    minDist = 1000000;
    dist = minDist = round2(getDistance(-d, y, x, y));
    dist = round2(getDistance(x, -d, x, y));
    if (dist < minDist)
        minDist = dist;
    dist = round2(getDistance(dl + d, y, x, y));
    if (dist < minDist)
        minDist = dist;
    dist = round2(getDistance(x, dw, x, y));
    if (dist < minDist)
        minDist = dist;
    return minDist;
}


function getMinDistToBorderNum(x, y, dl, dw, d) {
    minSide = 0;
    dist = round2(getDistance(-d, y, x, y));
    minDist = dist;
    dist = round2(getDistance(x, -d, x, y));
    if (dist < minDist) {
        minDist = dist;
        minSide = 1;
    }
    dist = round2(getDistance(dl + d, y, x, y));
    if (dist < minDist) {
        minDist = dist;
        minSide = 2;
    }
    dist = round2(getDistance(x, dw, x, y));
    if (dist < minDist) {
        minDist = dist;
        minSide = 3;
    }
    return minSide;
}