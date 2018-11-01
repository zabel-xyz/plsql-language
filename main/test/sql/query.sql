insert into EMPLOYEES (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, HIRE_DATE)
values (456, 'Zabel', 'XYZ', 'xyz@test.ch', sysdate)
/

insert into EMPLOYEES (ID, FIRST_NAME, NAME)
values (456, 'Zabel', 'XYZ')
/

commit
/

rollback
/

select * from EMPLOYEES
/

begin
  employee_pkg.setActive('Khoo');
end;
/

select employee_pkg.getActive from dual
/

select login_pkg.getActive from dual
/