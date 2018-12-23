CREATE OR REPLACE PACKAGE MyPackage2
as

  type txyz_myType is record(
      myChar varchar2
    , myNumber number
    , myField myTable.myField%type
  );
  type ttxyz_myType is table of txyz_myType;

  myConst constant char(2) := '10';
  myGlobalVar number := 10;

  /**
   * Comment איט
   */
  function get_myValue(param1 in varchar2)
    return varchar2;

  /**
   * Comment
   */
  procedure set_myValue(param1 in varchar2);

  procedure "do"(param1 in varchar2);

  procedure myCall(param1 in varchar2);

end;
/