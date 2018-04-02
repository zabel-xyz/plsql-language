update myTable
set myField = MyPackage.set_myValue('toto')
/

update myTable2
set myField2 = pck_2.myfunction('toto')
/

declare
  xyz MyPackage2.txyz_myType;
  abc MyPackage.ttxyz_myType;
begin
  if x = schema.MyPackage.myConst
  if y = MyPackage2.myGlobalVar
end
/