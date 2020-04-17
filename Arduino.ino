#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9
#define SS_PIN          10

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
	Serial.begin(9600);
	while (!Serial);
	SPI.begin();
	mfrc522.PCD_Init();
	mfrc522.PCD_DumpVersionToSerial();
	Serial.println(F("Scan PICC to see UID, SAK, type, and data blocks..."));
}

void loop() {
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return;
    }

    if (!mfrc522.PICC_ReadCardSerial()) {
        return;
    }

    Serial.print("Card detected, UID: ");
    Serial.print(mfrc522.uid.uidByte[0]);
    Serial.print(mfrc522.uid.uidByte[1]);
    Serial.print(mfrc522.uid.uidByte[2]);
    Serial.println(mfrc522.uid.uidByte[3]);
}