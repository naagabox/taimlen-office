USE timeline_proyek;

RENAME TABLE `user` TO `tbl_user`;
RENAME TABLE `account` TO `tbl_account`;
RENAME TABLE `session` TO `tbl_session`;
RENAME TABLE `verificationtoken` TO `tbl_verification_token`;
RENAME TABLE `project` TO `tbl_project`;
RENAME TABLE `projectmember` TO `tbl_project_member`;
RENAME TABLE `task` TO `tbl_task`;
RENAME TABLE `activitylog` TO `tbl_activity_log`;