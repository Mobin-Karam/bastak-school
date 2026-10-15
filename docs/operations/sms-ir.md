# SMS.ir campaigns

The SMS workspace is a school product module. It resolves recipients on the API from active users, active organization memberships, and `UserRoleAssignment -> Role`; the legacy `users.role` column is never an audience authority.

## Configure

1. Create an API key in the SMS.ir developer panel and identify an approved sending line.
2. A platform administrator enters the API key and line in **Admin → پیامک → پیکربندی امن**. The key is encrypted at rest and is never returned to the browser after saving.
3. Set only `SMS_CONFIG_ENCRYPTION_KEY` through the server's secret manager; this is the encryption root, not the SMS.ir credential. Do not put the SMS.ir key in an environment file.
4. Keep dry-run enabled for local development, tests, and CI. Send a controlled small campaign before enabling production broadcasts.

`SMSIR_MAX_BATCH_SIZE` defaults to 100 and is capped at 100. The API persists a campaign, recipient snapshots, and batch records before submission. A retry sends only recipients previously marked failed.

## Access and safety

`sms.read` views previews and history; `sms.send` creates and dispatches; `sms.manage` retries failures and views provider status. The API additionally requires active management authority: only a platform administrator, or an active organization administrator/principal in the selected school, can use the SMS workspace. Only a platform administrator can configure the shared provider. The organization feature list contains **پیامک**, allowing platform administrators to enable or disable the module for any school or institution.

The browser receives masked phone numbers only. API keys, destination lists, and provider authorization headers are never returned or written to audit metadata. An operator can select a future timestamp, which SMS.ir stores as a provider-scheduled pack; the schedule can be cancelled before it is sent. Delivery reports are refreshed manually by the operator and retain provider state without guessing undocumented provider state codes.
