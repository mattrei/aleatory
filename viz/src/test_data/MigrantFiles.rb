require "google/apis/drive_v2"
require "googleauth"

MIGRANTS_FILE_KEY = '1YNqIzyQfEn4i_be2GGWESnG2Q80E_fLASffsXdCOftI'

CREDENTIALS_FILE = 'google_api_credentials.json'
KEY_FILE = './Aleatory.p12'

SA_ID = '262990023426-kl89afbq7bd53p3p7d7j076oorvoqr10@developer.gserviceaccount.com'

drive = Google::Apis::DriveV2::DriveService.new

key = Google::APIClient::KeyUtils.load_from_pkcs12(KEY_FILE, 'notasecret')
asserter = Google::APIClient::JWTAsserter.new(
    SA_ID,
    ['https://www.googleapis.com/auth/drive'],
    key
)
client.authorization = asserter.authorize
session = GoogleDrive.login_with_oauth(client.authorization.access_token)

ws = session.spreadsheet_by_key(MIGRANTS_FILE_KEY).worksheets[0]
p ws["B3"] 
