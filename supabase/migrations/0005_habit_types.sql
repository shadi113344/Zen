alter table habits drop constraint if exists habits_type_check;
alter table habits add constraint habits_type_check
  check (type in ('check', 'numeric', 'milestone', 'onetime'));
