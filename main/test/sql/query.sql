insert into EMPLOYEES (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, HIRE_DATE)
values (456, 'XYZ', 'TEST', 'xyz@test.com', sysdate)
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