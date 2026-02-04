import db from './src/database/db';

db.serialize(() => {
    // Delete all enrollments for student_id = 4 (assuming user is student 4 based on previous logs)
    db.run('DELETE FROM enrollments WHERE student_id = ?', [4], function (err) {
        if (err) console.error(err);
        else console.log(`Deleted ${this.changes} enrollments for student 4.`);
    });
});
