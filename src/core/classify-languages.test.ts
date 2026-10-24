import { describe, expect, it } from "vitest";
import { classifyTitle } from "./classify";
import type { DisciplineSlug } from "./types";

type Case = [country: string, title: string, disciplines: DisciplineSlug[]];

describe("classifyTitle in local languages", () => {
  it.each<Case>([
    ["de", "Werkstudent DevOps (m/w/d)", ["devops"]],
    ["de", "Junior Softwareentwickler (m/w/d)", ["software"]],
    ["de", "Ausbildung Fachinformatiker für Anwendungsentwicklung", ["software"]],
    ["de", "Ausbildung Fachinformatiker Systemintegration (m/w/d)", ["systems"]],
    ["de", "Berufseinsteiger Backend-Entwickler Java", ["software", "backend"]],
    ["at", "Praktikum Cloud Engineering", ["cloud"]],
    ["ch", "Praktikant Software Engineering 80-100%", ["software"]],
    ["fr", "Développeur Full Stack Junior H/F", ["software", "fullstack"]],
    ["fr", "Alternance - Ingénieur Système et Réseau", ["systems"]],
    ["fr", "Stage - Chef de projet IT", ["tech-pm"]],
    ["fr", "Developpeur Debutant", ["software"]],
    ["be", "Junior Ontwikkelaar .NET", ["software"]],
    ["be", "Stagiaire Développeur Web", ["software", "frontend"]],
    ["ca", "Développeur(se) junior", ["software"]],
    ["es", "Becario/a Desarrollo de Software", ["software"]],
    ["es", "Desarrollador Web Junior", ["software", "frontend"]],
    ["mx", "Desarrollador Jr. React", ["software"]],
    ["es", "Prácticas Administrador de Sistemas", ["systems"]],
    ["it", "Stagista Sviluppatore Java", ["software"]],
    ["it", "Neolaureato Sistemista", ["systems"]],
    ["nl", "Starter Systeembeheerder", ["systems"]],
    ["nl", "Afstudeerstage Software Ontwikkelaar", ["software"]],
    ["pl", "Młodszy Programista Java", ["software"]],
    ["pl", "Stażysta DevOps", ["devops"]],
    ["br", "Desenvolvedor Júnior", ["software"]],
    ["br", "Estágio em Desenvolvimento de Software - Desenvolvedor", ["software"]],
    ["br", "Analista de Sistemas Jr", ["systems"]],
  ])("%s accepts %s", (country, title, disciplines) => {
    expect(classifyTitle(title, country)).toEqual({ entryLevel: true, disciplines });
  });

  it.each([
    ["de", "Teamleiter Softwareentwicklung"],
    ["de", "Erfahrener Entwickler mit Junior-Mentoring"],
    ["fr", "Développeur Confirmé"],
    ["fr", "Responsable des stagiaires IT"],
    ["es", "Jefe de Desarrollo - programa becarios"],
    ["it", "Responsabile Sviluppatori Junior"],
    ["nl", "Medior Ontwikkelaar"],
    ["pl", "Starszy Programista"],
    ["pl", "Regular Java Developer"],
    ["br", "Desenvolvedor Pleno"],
    ["br", "Desenvolvedor Sênior"],
  ])("%s rejects %s", (country, title) => {
    expect(classifyTitle(title, country).entryLevel).toBe(false);
  });

  it("uses a Discipline Term's 'manager' or 'chef' without treating it as seniority", () => {
    expect(classifyTitle("Junior Projektleiter IT", "de").entryLevel).toBe(true);
    expect(classifyTitle("Chef de projet junior", "fr").entryLevel).toBe(true);
    expect(classifyTitle("Kierownik projektu - staż", "pl").entryLevel).toBe(true);
  });

  it("applies English everywhere, but local lists only in their Countries", () => {
    expect(classifyTitle("Junior Software Engineer", "de").entryLevel).toBe(true);
    expect(classifyTitle("Graduate DevOps Engineer", "br").entryLevel).toBe(true);
    // "Pleno" is only a Seniority Marker in Portuguese-speaking Countries.
    expect(classifyTitle("Junior Developer Pleno", "gb").entryLevel).toBe(true);
    expect(classifyTitle("Werkstudent DevOps", "gb").entryLevel).toBe(false);
  });
});
