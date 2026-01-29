import request from 'supertest';
import { expect } from 'chai';
import { createApp } from '../../src/app';
import { initializeDatabase } from '../../src/database/setup';
import { Application } from 'express';

describe('Duplicate Exercise Prevention', () => {
    let app: Application;
    let instructorCookies: any;

    before(async () => {
        await initializeDatabase();
        app = createApp();

        // Login as default instructor
        const instructorLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'carlos@academia.com',
                password: 'senha123'
            });

        if (instructorLogin.status !== 200) {
            console.error('Login Error:', instructorLogin.body);
        }
        expect(instructorLogin.status).to.equal(200);
        // Capture cookies
        instructorCookies = instructorLogin.headers['set-cookie'];
    });

    it('should prevent creating exercises with the same name (ignoring case and whitespace)', async () => {
        const exerciseName = "Unique Exercise " + Date.now();

        // 1. Create first exercise
        const res1 = await request(app)
            .post('/api/instructor/exercises')
            .set('Cookie', instructorCookies)
            .send({
                name: exerciseName,
                description: "Description",
                series: 3,
                repetitions: 12,
                weight: 10
            });

        expect(res1.status).to.equal(201);

        // 2. Create duplicate with different casing and whitespace
        const duplicateName = `  ${exerciseName.toUpperCase()}  `;
        const res2 = await request(app)
            .post('/api/instructor/exercises')
            .set('Cookie', instructorCookies)
            .send({
                name: duplicateName,
                description: "Description 2",
                series: 3,
                repetitions: 12,
                weight: 10
            });

        expect(res2.status).to.equal(400);
        expect(res2.body.error).to.equal('Já existe um exercício com este nome.');
    });
});
