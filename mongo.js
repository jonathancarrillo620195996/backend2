const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('Te faltan parámetros. Se requiere al menos la contraseña.');
  console.log('Uso para listar: node mongo.js <password>');
  console.log('Uso para añadir: node mongo.js <password> <Name> <Number>');
  process.exit(1);
}

const password = process.argv[2]
const url = `mongodb+srv://jonalex:${password}@cluster0.qgeqwck.mongodb.net/phonebookApp?appName=Agenda`

mongoose.set('strictQuery', false);

mongoose.connect(url);

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema);

if (process.argv.length === 5) {
  const name = process.argv[3];
  const number = process.argv[4];

  if (!name || !number) {
    console.log('Faltan el nombre o el número al intentar añadir una persona.');
    mongoose.connection.close();
    process.exit(1);
  }

  const person = new Person({
    name: name,
    number: number,
  });

  person.save().then(result => {
    console.log(`added ${name} number ${number} to phonebook`);
    mongoose.connection.close();
  })

} 
else if (process.argv.length === 3) {
  
  Person.find({}).then(persons => {
    console.log('phonebook:');
    persons.forEach(person => {
      console.log(`${person.name} ${person.number}`);
    });
    mongoose.connection.close();
  })

} 

else {
  console.log('Número de argumentos incorrecto. Por favor, revisa el uso.');
  console.log('Uso para listar: node mongo.js <password>');
  console.log('Uso para añadir: node mongo.js <password> <Name> <Number>');
  mongoose.connection.close(); 
  process.exit(1);
}