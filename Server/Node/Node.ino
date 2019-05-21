void setup() {
  // initialize serial 
  Serial.begin(9600);
}


void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  //invert reading from 1024, and send it over serial
  Serial.println(1024-sensorValue);
  delay(50);       
}