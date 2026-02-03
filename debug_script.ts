import db from './src/database/db';

db.serialize(() => {
    db.all('SELECT * FROM gym_class', [], (err, classes) => {
        if (err) console.error(err);
        else console.log('Classes:', classes);

        db.all('SELECT * FROM enrollments', [], (err, enrollments) => {
            if (err) console.error(err);
            else console.log('Enrollments:', enrollments);
        });
    });
});
