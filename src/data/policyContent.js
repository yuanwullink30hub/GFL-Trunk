import React from 'react';

const S = {
  h2: { color: '#a855f7', fontSize: '1.1rem', marginTop: '1.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold' },
  h3: { color: '#c4b5fd', fontSize: '0.9rem', marginTop: '1.25rem', marginBottom: '0.5rem', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold' },
  p: { marginBottom: '0.75rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.8 },
  ul: { marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' },
  ol: { marginLeft: '1.5rem', marginBottom: '0.75rem' },
  li: { marginBottom: '0.35rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.6 },
  strong: { color: '#c4b5fd' },
  updated: { color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.5rem', fontStyle: 'italic', fontFamily: "'Figtree', sans-serif" },
  box: { background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.35rem', padding: '1rem', margin: '1rem 0' },
  warn: { background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '0.35rem', padding: '1rem', margin: '1rem 0' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '1rem 0', fontSize: '0.8rem' },
  th: { border: '1px solid rgba(168,85,247,0.2)', padding: '0.5rem', textAlign: 'left', color: '#c4b5fd', fontWeight: 'bold', background: 'rgba(168,85,247,0.1)', fontFamily: "'Figtree', sans-serif", fontSize: '0.8rem' },
  td: { border: '1px solid rgba(168,85,247,0.2)', padding: '0.5rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.8rem' },
};

export const POLICY_CONTENT = {
  terms: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. Inleiding</h2>
      <p style={S.p}>Welkom bij Garden for Life. Deze algemene voorwaarden regelen het gebruik van onze website, diensten en applicaties. Door gebruik te maken van Garden for Life, ga je akkoord met deze voorwaarden.</p>
      <h2 style={S.h2}>2. Definities</h2>
      <p style={S.p}>In deze voorwaarden hebben de volgende woorden de volgende betekenissen:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Platform:</strong> De website, mobiele app en alle gerelateerde diensten van Garden for Life</li>
        <li style={S.li}><strong style={S.strong}>Gebruiker:</strong> Elke persoon die het Platform gebruikt</li>
        <li style={S.li}><strong style={S.strong}>Account:</strong> De persoonlijke account van een Gebruiker op het Platform</li>
        <li style={S.li}><strong style={S.strong}>Inhoud:</strong> Alle tekst, afbeeldingen, video's en ander materiaal op het Platform</li>
        <li style={S.li}><strong style={S.strong}>Diensten:</strong> De assessment-, profiler- en raportdiensten aangeboden door Garden for Life</li>
      </ul>
      <h2 style={S.h2}>3. Acceptatie van Voorwaarden</h2>
      <p style={S.p}>Door op het Platform te navigeren, een account aan te maken of onze Diensten te gebruiken, accepteer je deze Algemene Voorwaarden in hun geheel. Wij behouden ons het recht voor deze voorwaarden op elk moment te wijzigen. Voortgezet gebruik van het Platform na wijzigingen betekent acceptatie van de gewijzigde voorwaarden.</p>
      <h2 style={S.h2}>4. Gebruiksrechten</h2>
      <p style={S.p}>Wij verlenen je een niet-exclusief, niet-overdraagbaar recht om het Platform en onze Diensten te gebruiken in overeenstemming met deze Voorwaarden.</p>
      <h3 style={S.h3}>4.1 Verbodsbepalingen</h3>
      <p style={S.p}>Je mag het Platform niet gebruiken voor:</p>
      <ul style={S.ul}>
        <li style={S.li}>Illegale activiteiten of doeleinden</li>
        <li style={S.li}>Het schaden, belasteren of bedreigen van andere gebruikers</li>
        <li style={S.li}>De verspreiding van malware of virussen</li>
        <li style={S.li}>Het schenden van intellectuele-eigendomsrechten</li>
        <li style={S.li}>Automatisering of scrapen van inhoud zonder toestemming</li>
        <li style={S.li}>Manipulatie of milking van de assessment-algoritmen</li>
      </ul>
      <h2 style={S.h2}>5. Account en Beveiliging</h2>
      <p style={S.p}>Je bent verantwoordelijk voor het vertrouwelijk houden van je accountgegevens en wachtwoord. Je bent aansprakelijk voor alle activiteiten die plaatsvinden onder je account. Meld verdachte activiteiten onmiddellijk aan ons.</p>
      <h2 style={S.h2}>6. Intellectuele Eigendom</h2>
      <p style={S.p}>Alle inhoud op het Platform, inclusief tekst, afbeeldingen, design en software, is eigendom van Garden for Life of haar licentiegevers en is beschermd onder auteursrecht en andere wetten inzake intellectuele eigendom.</p>
      <h2 style={S.h2}>7. Beperking van Aansprakelijkheid</h2>
      <p style={S.p}>Het Platform wordt aangeboden op "as-is" basis zonder garanties of voorwaarden van welke aard dan ook. Garden for Life is niet aansprakelijk voor enig indirect, incidenteel, speciaal of gevolgschaade voortvloeiend uit je gebruik van het Platform of de Diensten, inclusief maar niet beperkt tot verlies van gegevens, winst of bedrijfswaarde.</p>
      <h2 style={S.h2}>8. Wijzigingen van Diensten</h2>
      <p style={S.p}>Garden for Life behoudt zich het recht voor de Diensten op elk moment te wijzigen, op te schorten of in te stellen zonder voorafgaande kennisgeving. Wij zullen redelijke inspanningen leveren om gebruikers op de hoogte te stellen van significante wijzigingen.</p>
      <h2 style={S.h2}>9. Contactgegevens</h2>
      <p style={S.p}>Voor vragen, klachten of opmerkingen over deze Voorwaarden, neem contact met ons op via:</p>
      <p style={S.p}><strong style={S.strong}>Garden for Life</strong><br/>Email: support@gardenforlife.nl<br/>Website: www.gardenforlife.nl</p>
      <h2 style={S.h2}>10. Slotbepaling</h2>
      <p style={S.p}>Deze Voorwaarden vormen de gehele overeenkomst tussen jou en Garden for Life met betrekking tot je gebruik van het Platform. Als enige bepaling ongeldig is, blijven de overige bepalingen geldig.</p>
    </>
  ),

  privacy: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. Inleiding</h2>
      <p style={S.p}>Garden for Life respecteert je privacy en is toegewijd aan het beschermen van je persoonsgegevens. Dit Privacybeleid beschrijft hoe wij je gegevens verzamelen, gebruiken, opslaan en beschermen in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en andere toepasselijke wetgeving.</p>
      <h2 style={S.h2}>2. Verantwoordelijke</h2>
      <p style={S.p}><strong style={S.strong}>Garden for Life</strong> is verantwoordelijk voor de verwerking van je persoonsgegevens.</p>
      <p style={S.p}>Voor vragen over je gegevens of je rechten, neem contact met ons op:</p>
      <ul style={S.ul}>
        <li style={S.li}>Email: privacy@gardenforlife.nl</li>
        <li style={S.li}>Website: www.gardenforlife.nl</li>
      </ul>
      <h2 style={S.h2}>3. Welke Gegevens Verzamelen We?</h2>
      <h3 style={S.h3}>3.1 Gegevens die je actief verschaft:</h3>
      <ul style={S.ul}>
        <li style={S.li}>Registratiegegevens: naam, e-mailadres, wachtwoord</li>
        <li style={S.li}>Profielgegevens: voorkeur voor taal, profoto</li>
        <li style={S.li}>Assessmentantwoorden: je reacties op psychologische vragen</li>
        <li style={S.li}>Communicatiegegevens: berichten, feedback</li>
      </ul>
      <h3 style={S.h3}>3.2 Gegevens die we automatisch verzamelen:</h3>
      <ul style={S.ul}>
        <li style={S.li}>Technische gegevens: IP-adres, browsertype, besturingssysteem</li>
        <li style={S.li}>Gebruiksgegevens: pagina's bezocht, tijd doorgebracht, klikken</li>
        <li style={S.li}>Geolocatiegegevens: land/regio (uit IP-adres)</li>
        <li style={S.li}>Apparaatgegevens: unieke apparaat-ID's, schermresolutie</li>
      </ul>
      <h2 style={S.h2}>4. Doeleinden van Gegevensverwerking</h2>
      <p style={S.p}>Wij verwerken je gegevens voor de volgende doeleinden:</p>
      <ul style={S.ul}>
        <li style={S.li}>Levering van Assessmentdiensten en generatie van persoonlijke profielrapporten</li>
        <li style={S.li}>Accountbeheer en authenticatie</li>
        <li style={S.li}>Communicatie over de Diensten</li>
        <li style={S.li}>Systeemverbeteringen (op basis van geanonimiseerde gegevens)</li>
        <li style={S.li}>Betaevaluatie en onderzoek (met uitdrukkelijke toestemming)</li>
        <li style={S.li}>Naleving van wettelijke verplichtingen</li>
        <li style={S.li}>Beveiliging tegen fraude en misbruik</li>
      </ul>
      <h2 style={S.h2}>5. Rechtsgrondslag voor Verwerking</h2>
      <p style={S.p}>De verwerking van je gegevens is gebaseerd op:</p>
      <ul style={S.ul}>
        <li style={S.li}>Uitvoering van een overeenkomst (gebruik van het Platform)</li>
        <li style={S.li}>Uitdrukkelijke toestemming (voor Art. 9 psychologische data)</li>
        <li style={S.li}>Gerechtvaardigd belang (systeembeveiliging, fraudepreventie)</li>
        <li style={S.li}>Naleving van wettelijke verplichtingen</li>
      </ul>
      <h2 style={S.h2}>6. Opslag en Bewaringsduur</h2>
      <p style={S.p}>Assessmentgegevens worden opgeslagen in beveiligde datacenters en worden:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>90 dagen bewaard</strong> voor normale betaevaluatie</li>
        <li style={S.li}><strong style={S.strong}>27 september 2026</strong> verwijderd (automatisch)</li>
        <li style={S.li}>Beschermd door versleuteling en toegangscontrole</li>
        <li style={S.li}>Alleen toegankelijk voor beheerders voor systeemverbetering</li>
      </ul>
      <h2 style={S.h2}>7. Delen van Gegevens</h2>
      <p style={S.p}>Wij delen je gegevens niet met derden, behalve in de volgende gevallen:</p>
      <ul style={S.ul}>
        <li style={S.li}>Serviceproviders (hosting, beveiligingsbedrijven) op basis van verwerkingsovereenkomsten</li>
        <li style={S.li}>Wettelijke verplichting (rechtsbevel, handhaving)</li>
        <li style={S.li}>Bescherming van rechten en veiligheid van Garden for Life en gebruikers</li>
      </ul>
      <h2 style={S.h2}>8. Je Rechten</h2>
      <p style={S.p}>Onder de AVG heb je de volgende rechten:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Recht op inzage:</strong> Je kunt een kopie van je persoonsgegevens aanvragen</li>
        <li style={S.li}><strong style={S.strong}>Recht op rectificatie:</strong> Je kunt onjuiste gegevens laten corrigeren</li>
        <li style={S.li}><strong style={S.strong}>Recht op verwijdering:</strong> Je kunt verwijdering van je gegevens aanvragen ("recht om vergeten te worden")</li>
        <li style={S.li}><strong style={S.strong}>Recht op beperking:</strong> Je kunt verwerking van je gegevens beperken</li>
        <li style={S.li}><strong style={S.strong}>Recht op gegevensoverdraagbaarheid:</strong> Je kunt je gegevens in gestructureerd formaat ontvangen</li>
        <li style={S.li}><strong style={S.strong}>Recht op bezwaar:</strong> Je kunt bezwaar maken tegen bepaalde verwerkingen</li>
      </ul>
      <p style={S.p}>Om deze rechten uit te oefenen, stuur een e-mail naar <strong style={S.strong}>privacy@gardenforlife.nl</strong>.</p>
      <h2 style={S.h2}>9. Beveiliging</h2>
      <p style={S.p}>Wij implementeren technische en organisatorische maatregelen ter bescherming van je gegevens tegen:</p>
      <ul style={S.ul}>
        <li style={S.li}>Ongeautoriseerde toegang</li>
        <li style={S.li}>Verlies of beschadiging</li>
        <li style={S.li}>Ongeautoriseerde wijziging</li>
        <li style={S.li}>Gegevensscheiding</li>
      </ul>
      <h2 style={S.h2}>10. Klachten</h2>
      <p style={S.p}>Heb je een klacht over onze gegevensverwerking? Neem contact met ons op of dien een klacht in bij je nationale toezichthoudende autoriteit.</p>
      <h2 style={S.h2}>11. Wijzigingen van dit Beleid</h2>
      <p style={S.p}>Wij kunnen dit Privacybeleid op elk moment wijzigen. Wijzigingen worden geplaatst op deze pagina en je wordt op de hoogte gesteld van substantiële wijzigingen.</p>
    </>
  ),

  consent: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. Wettelike Achtergrond</h2>
      <p style={S.p}>Artikel 9 van de Algemene Verordening Gegevensbescherming (AVG) verbiedt de verwerking van speciale categorieën van persoonsgegevens, waaronder gegevens die psychology, gedraskenmerken en persoonlijkheidsoriëntaties onthullen.</p>
      <p style={S.p}>Garden for Life verwerkt deze gevoelige gegevens <strong style={S.strong}>uitsluitend</strong> op basis van je <strong style={S.strong}>uitdrukkelijke toestemming</strong>, gegeven vóór het starten van een assessment.</p>
      <div style={S.box}>
        <h3 style={S.h3}>⚠️ Belangrijk</h3>
        <p style={S.p}>Zonder uitdrukkelijke toestemming voor de verwerking onder Art. 9 zal Garden for Life geen psychologische gegevens analyseren of opslaan.</p>
      </div>
      <h2 style={S.h2}>2. Wat Zijn Art. 9 Speciale Categorieën?</h2>
      <p style={S.p}>In de context van dit Platform omvatten Art. 9 gegevens:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Archetypepatronen:</strong> Persoonlijkheidsarchetypen gedefinieerd in het duaal-kernmodel</li>
        <li style={S.li}><strong style={S.strong}>Gedragskenmerken:</strong> Statistisch afgeleide gedragstendensen en reactiepatronen</li>
        <li style={S.li}><strong style={S.strong}>Persoonlijkheidsoriëntaties:</strong> Psychologische profielelementen (schaduw, blinde vlek, talent)</li>
        <li style={S.li}><strong style={S.strong}>Psychologische Inzichten:</strong> Analyse van gedachtepatronen en motivatieveranderingen</li>
        <li style={S.li}><strong style={S.strong}>Bètagegevens:</strong> Testresultaten gebruikt voor systemverbetering en algoritmevalidatie</li>
      </ul>
      <h2 style={S.h2}>3. Je Toestemming</h2>
      <p style={S.p}>Door het afronden van het assessment en het aanvinken van het toestemmingsvak accepteer je:</p>
      <ol style={S.ol}>
        <li style={S.li}><strong style={S.strong}>Automatisering-gegevensanalyse:</strong> Je antwoorden worden volledig geautomatiseerd geanalyseerd door AI-modellen om een persoonlijkheidsarchetype, schaduwprofiel en blinde vlekken model te genereren.</li>
        <li style={S.li}><strong style={S.strong}>Psychologische Karakterisering:</strong> Het AI-model zal psychologische kenmerken afleiden en classificeren die gevoelig kunnen zijn.</li>
        <li style={S.li}><strong style={S.strong}>Bètaopslag & Evaluatie:</strong> Het volledige rapport wordt tijdelijk opgeslagen uitsluitend voor bètaevaluatie en systeemverbetering — nooit voor commerciële doeleinden.</li>
        <li style={S.li}><strong style={S.strong}>Auditwaarneming:</strong> De beheerder heeft toegang tot opgeslagen rapporten uitsluitend ten behoeve van bètaevaluatie — dit wordt bijgehouden in een beveiligd auditlog.</li>
        <li style={S.li}><strong style={S.strong}>Automatische Verwijdering:</strong> Alle rapportdata wordt uiterlijk op 27 september 2026 permanent en onherroepelijk verwijderd, tenzij je eerder verwijdering aanvraagt.</li>
        <li style={S.li}><strong style={S.strong}>Intrekking:</strong> Je hebt het recht je toestemming op elk moment in te trekken. Bij intrekking wordt je volledige profieldata binnen 30 dagen verwijderd.</li>
        <li style={S.li}><strong style={S.strong}>Niet-Klinisch:</strong> Dit rapport is geen klinische diagnose en vervangt professionele psychologische of medische begeleiding niet.</li>
        <li style={S.li}><strong style={S.strong}>Betarisico's:</strong> Omdat dit een bètaproduct is, kunnen inaccuracies of onverwachte resultaten optreden. Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen gebaseerd op deze rapportage.</li>
      </ol>
      <h2 style={S.h2}>4. Opslaginrichtingen</h2>
      <p style={S.p}>Je Art. 9 gegevens worden opgeslagen met de volgende beveiligingsmaatregelen:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Versleuteling:</strong> End-to-end versleuteling in transit en in rust</li>
        <li style={S.li}><strong style={S.strong}>Toegangscontrole:</strong> Alleen beheerders kunnen the rapportdata inzien</li>
        <li style={S.li}><strong style={S.strong}>Auditlogging:</strong> Alle toegang wordt geregistreerd en gemonitord</li>
        <li style={S.li}><strong style={S.strong}>Geografische Isolatie:</strong> Gegevens opgeslagen in EU datacenters</li>
        <li style={S.li}><strong style={S.strong}>Regelmatige Backups:</strong> Alleen behouden voor 90 dagen</li>
      </ul>
      <h2 style={S.h2}>5. Je Rechten onder Art. 9</h2>
      <p style={S.p}>In aanvulling op standaard AVG-rechten heb je aanvullende rechten met betrekking tot Art. 9 gegevens:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Recht om inzicht te nemen:</strong> Vraag je volledige gegenereerde profiel en analyserapport aan</li>
        <li style={S.li}><strong style={S.strong}>Recht op verwijdering:</strong> Vraag onmiddellijke verwijdering van alle rapportdata aan</li>
        <li style={S.li}><strong style={S.strong}>Recht op intrekking:</strong> Trek je toestemming op elk moment in</li>
        <li style={S.li}><strong style={S.strong}>Recht op bezwaar:</strong> Maak bezwaar tegen automatisering-verwerking</li>
        <li style={S.li}><strong style={S.strong}>Recht op auditlog:</strong> Vraag aan wie je rapport heeft ingezien</li>
      </ul>
      <h2 style={S.h2}>6. Contact & Vragen</h2>
      <p style={S.p}>Heb je vragen over Art. 9 gegevensverwerking of wil je je rechten uitoefenen?</p>
      <p style={S.p}><strong style={S.strong}>Email:</strong> privacy@gardenforlife.nl<br/><strong style={S.strong}>Website:</strong> www.gardenforlife.nl</p>
      <h2 style={S.h2}>7. Bezwaarprocedure</h2>
      <p style={S.p}>Heb je bezwaren tegen hoe wij je Art. 9 gegevens verwerken? Je kunt:</p>
      <ol style={S.ol}>
        <li style={S.li}>Ons direct contacteren via privacy@gardenforlife.nl</li>
        <li style={S.li}>Een klacht indienen bij je nationale toezichthoudende autoriteit (Autoriteit Persoonsgegevens in Nederland)</li>
        <li style={S.li}>Juridische stappen ondernemen onder toepasselijk recht</li>
      </ol>
      <h2 style={S.h2}>8. Wijzigingen van dit Dokument</h2>
      <p style={S.p}>Wij kunnen dit Toestemmingsdocument updaten als wetgeving of praktijken veranderen. Je ontvangt kennisgeving van substantiële wijzigingen.</p>
    </>
  ),

  cookies: (
    <>
      <p style={S.updated}>Versiedatum: 16 maart 2026 | Versie 1.1 | Taal: Nederlands</p>
      <p style={S.p}>Garden For Life gebruikt geen HTTP-cookies. Het platform werkt uitsluitend met <strong style={S.strong}>localStorage</strong> en <strong style={S.strong}>sessionStorage</strong> — browseropslag die alleen op uw eigen apparaat staat en nooit automatisch naar onze servers wordt verstuurd. Er is geen cookiebanner op deze website omdat hiervoor wettelijk geen toestemming vereist is.</p>
      <h2 style={S.h2}>1. Geen Cookies — Wel Lokale Browseropslag</h2>
      <p style={S.p}>Een traditionele cookie is een klein bestandje dat een website op uw apparaat plaatst en bij elk bezoek automatisch terugstuurt naar de server. Garden For Life gebruikt geen HTTP-cookies van welke aard dan ook.</p>
      <p style={S.p}>In plaats daarvan maakt Garden For Life gebruik van <strong style={S.strong}>localStorage</strong> en <strong style={S.strong}>sessionStorage</strong> — twee opslagmechanismen die standaard in uw browser ingebouwd zijn. Het essentiële verschil:</p>
      <ul style={S.ul}>
        <li style={S.li}>Lokale opslag blijft op uw apparaat. Het wordt nooit naar onze servers verzonden.</li>
        <li style={S.li}>De data is alleen leesbaar door de Garden For Life website zelf — niet door derden.</li>
        <li style={S.li}>U heeft volledige controle: u kunt de opslag op elk moment wissen via uw browserinstellingen.</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Juridische basis:</strong> Hoewel localStorage geen cookie is in de traditionele zin, valt opslag van persoonsgegevens op een apparaat onder de Telecommunicatiewet art. 11.7a en de ePrivacy-richtlijn. Voor strikt noodzakelijke opslag is geen toestemming vereist.</p>
      <h2 style={S.h2}>2. Wat Slaan Wij Op in Uw Browser?</h2>
      <h3 style={S.h3}>2.1 Strikt Noodzakelijke Opslag (localStorage)</h3>
      <p style={S.p}>De volgende items worden opgeslagen om het platform correct te laten werken:</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_beta_access</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Validatie van de betapasskey — geeft toegang tot de besloten betafase.</td></tr>
          <tr><td style={S.td}>gfl_token</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>JWT authenticatietoken — identificeert uw ingelogde sessie.</td></tr>
          <tr><td style={S.td}>gfl_assessment_session</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Slaat de huidige assessmentsessie op.</td></tr>
          <tr><td style={S.td}>gfl_assessment_history</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Bewaart de laatste 10 assessmentsessies lokaal.</td></tr>
          <tr><td style={S.td}>gfl_error_audit_log</td><td style={S.td}>Max 100 entries</td><td style={S.td}>Foutlog voor technische diagnose.</td></tr>
        </tbody>
      </table>
      <h3 style={S.h3}>2.2 Persoonlijke Werkruimte (localStorage)</h3>
      <p style={S.p}>De volgende items worden opgeslagen als onderdeel van de persoonlijke werkruimtefunctionaliteit:</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_admin_notes</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Persoonlijke notities van de beheerder.</td></tr>
          <tr><td style={S.td}>gfl_client_notes</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Persoonlijke notities per cliënt.</td></tr>
          <tr><td style={S.td}>gfl_admin_feedback</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Feedback en vragen van cliënten.</td></tr>
          <tr><td style={S.td}>gfl_client_contacts</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Contactboek.</td></tr>
          <tr><td style={S.td}>gfl_client_agenda</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Agenda en afspraken.</td></tr>
          <tr><td style={S.td}>gfl_client_inbox</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Inkomende berichten.</td></tr>
          <tr><td style={S.td}>gfl_contact_requests</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Contactaanvragen.</td></tr>
          <tr><td style={S.td}>gfl_brand_edits</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Aanpassingen aan merkgegevens.</td></tr>
          <tr><td style={S.td}>gfl_invoice_contacts</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Factuurcontacten.</td></tr>
          <tr><td style={S.td}>gfl_creditnote_contacts</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Creditnota-contacten.</td></tr>
          <tr><td style={S.td}>gfl_email_contacts</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>E-mailcontacten.</td></tr>
          <tr><td style={S.td}>gfl_invoice_num</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Factuurnummerteller.</td></tr>
          <tr><td style={S.td}>gfl_creditnote_num</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Creditnotanummerteller.</td></tr>
        </tbody>
      </table>
      <h3 style={S.h3}>2.3 SessionStorage</h3>
      <p style={S.p}>SessionStorage wordt automatisch gewist zodra u het browservenster of tabblad sluit.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>chunk_reload</td><td style={S.td}>Browservenster sluit</td><td style={S.td}>Eenmalige herlaadbeveiliging bij een verouderde deployversie.</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>3. Wat Wij Niet Gebruiken</h2>
      <ul style={S.ul}>
        <li style={S.li}>HTTP-cookies van welke aard dan ook</li>
        <li style={S.li}>Google Analytics, Google Tag Manager of andere Google-trackers</li>
        <li style={S.li}>Facebook Pixel of andere sociale media tracking</li>
        <li style={S.li}>Sentry of andere externe foutregistratiediensten</li>
        <li style={S.li}>Advertentienetwerken of retargeting</li>
        <li style={S.li}>Third-party embeds die opslag plaatsen</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Toekomstige analytics:</strong> Garden For Life overweegt mogelijk de toevoeging van Plausible Analytics — een cookieloze, privacy-vriendelijke analyticsdienst die geen persoonsgegevens verwerkt. Bij implementatie wordt dit beleid bijgewerkt.</p>
      <h2 style={S.h2}>4. Lokale Opslag Wissen</h2>
      <p style={S.p}>U kunt de lokale opslag van Garden For Life op elk moment wissen via uw browserinstellingen. Let op: dit verwijdert uw inlogstatus, lokale notities, contacten, agenda en overige lokaal opgeslagen werkruimtedata.</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Chrome:</strong> Instellingen → Privacy en beveiliging → Browsegegevens verwijderen</li>
        <li style={S.li}><strong style={S.strong}>Firefox:</strong> Instellingen → Privacy & Beveiliging → Cookies en sitegegevens → Gegevens verwijderen</li>
        <li style={S.li}><strong style={S.strong}>Safari:</strong> Voorkeuren → Privacy → Beheer websitegegevens → gardenforlife.nl → Verwijder</li>
        <li style={S.li}><strong style={S.strong}>Edge:</strong> Instellingen → Privacy, zoeken en services → Browsegegevens wissen</li>
      </ul>
      <h2 style={S.h2}>5. Wijzigingen in Dit Beleid</h2>
      <ol style={S.ol}>
        <li style={S.li}>Garden For Life behoudt zich het recht voor dit beleid te wijzigen bij uitbreiding van de platformfunctionaliteit.</li>
        <li style={S.li}>Bij toevoeging van diensten die tracking of niet-noodzakelijke opslag vereisen, wordt een passend toestemmingsmechanisme geïmplementeerd.</li>
        <li style={S.li}>De versiedatum bovenaan dit document geeft aan wanneer het beleid voor het laatst is gewijzigd.</li>
      </ol>
      <h2 style={S.h2}>6. Contact</h2>
      <p style={S.p}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community<br/><strong style={S.strong}>Adres:</strong> De Taxushaag 2, Zutphen, 7207MB</p>
      <p style={{...S.p, textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '1rem'}}>Garden For Life — Cookiebeleid & Lokale Opslag | Versie 1.1 | 16 maart 2026</p>
    </>
  ),

  ai: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. EU AI Act Compliance</h2>
      <p style={S.p}>Garden for Life voldoet aan de Europese AI-verordening (AI Act) door volledige transparantie over kunstmatige intelligentie in ons assessment-platform.</p>
      <h2 style={S.h2}>2. Wat Is AI in Garden for Life?</h2>
      <p style={S.p}>Garden for Life gebruikt geavanceerde machine learning-modellen om je assessmentantwoorden te analyseren en een persoonlijkheid- en archetype-profiel te genereren.</p>
      <div style={S.box}>
        <h3 style={S.h3}>⚠️ KRITIEK DISCLAIMER</h3>
        <p style={S.p}><strong style={S.strong}>Dit rapport is GEEN klinische diagnose.</strong> Garden for Life is geen vervanger voor professionele psychologische, psychiatrische of medische begeleiding. Raadpleeg altijd een gekwalificeerde professional voor gezondheidsgerelateerde vragen.</p>
      </div>
      <h2 style={S.h2}>3. Welke AI-Technologieën Gebruiken We?</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Natural Language Processing (NLP):</strong> Analyse van textantwoorden</li>
        <li style={S.li}><strong style={S.strong}>Pattern Recognition:</strong> Identificatie van gedragspatronen en tendensen</li>
        <li style={S.li}><strong style={S.strong}>Neural Networks:</strong> Diep leren voor archetype-classificatie</li>
        <li style={S.li}><strong style={S.strong}>Statistical Modeling:</strong> Schaduw- en blinde-vlekanalyse</li>
      </ul>
      <h2 style={S.h2}>4. Welke Gegevens Worden Geanalyseerd?</h2>
      <p style={S.p}>Het AI-model ontvangt en verwerkt:</p>
      <ul style={S.ul}>
        <li style={S.li}>Je antwoorden op alle assessment-vragen</li>
        <li style={S.li}>De tijd die je hebt besteed aan elke vraag</li>
        <li style={S.li}>Je selectiepatronen (welke opties je kiest)</li>
        <li style={S.li}>Gevoeligheidsindicatoren (angst, vertrouwen, resistentie)</li>
      </ul>
      <p style={S.p}>Het AI-model verwerkt <strong style={S.strong}>NIET</strong>:</p>
      <ul style={S.ul}>
        <li style={S.li}>Je naam, e-mailadres of persoonlijke identificatiegegevens</li>
        <li style={S.li}>Je locatie of IP-adres</li>
        <li style={S.li}>Je medische of klinische gegevens</li>
        <li style={S.li}>Je financiële informatie</li>
        <li style={S.li}>Externe datasources buiten het assessment</li>
      </ul>
      <h2 style={S.h2}>5. Hoe Werkt het AI-Model?</h2>
      <h3 style={S.h3}>Stap 1: Input-verwerking</h3>
      <p style={S.p}>Je antwoorden worden genormaliseerd en omgezet in numerieke waarden die het AI-model kan verwerken.</p>
      <h3 style={S.h3}>Stap 2: Feature-extractie</h3>
      <p style={S.p}>Het model identificeert belangrijke "features" die indicatief zijn voor je persoonlijkheid, gedragsstijl en psychologische oriëntatie.</p>
      <h3 style={S.h3}>Stap 3: Archetype-classificatie</h3>
      <p style={S.p}>Op basis van deze features wordt je geclassificeerd in een duaal-kernmodel met:</p>
      <ul style={S.ul}>
        <li style={S.li}>Primair archetype (dominante persoonlijkheidsstijl)</li>
        <li style={S.li}>Secundair archetype (ondersteunende stijl)</li>
        <li style={S.li}>Schaduwprofiel (verdroogde of onderontwikkelde aspecten)</li>
        <li style={S.li}>Blinde vlekken (onbewuste blinde plekken)</li>
      </ul>
      <h2 style={S.h2}>6. Trainingsgegevens & Bias</h2>
      <p style={S.p}>Ons AI-model is getraind op:</p>
      <ul style={S.ul}>
        <li style={S.li}>Duizenden geanonimiseerde assessmentresultaten</li>
        <li style={S.li}>Gevalideerde psychologische datasets</li>
        <li style={S.li}>Archetypische patronen uit de Jungische psychologie</li>
      </ul>
      <p style={S.p}>Wij controleren actief op bias en werken eraan om:</p>
      <ul style={S.ul}>
        <li style={S.li}>Vooroordeel uit te sluiten op grond van geslacht, leeftijd, ethnische afkomst</li>
        <li style={S.li}>Culturele verschillen in communicatiestijlen te respecteren</li>
        <li style={S.li}>Niet-westerse perspectieven te integreren</li>
      </ul>
      <h2 style={S.h2}>7. Nauwkeurigheid & Validatie</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Interne consistentie:</strong> Dezelfde antwoorden geven dezelfde profielen</li>
        <li style={S.li}>✅ <strong style={S.strong}>Test-retest betrouwbaarheid:</strong> Gebruikers krijgen vergelijkbare resultaten op hertoets</li>
        <li style={S.li}>✅ <strong style={S.strong}>Convergente validiteit:</strong> Resultaten correleren met erkende persoonlijkheidsmaten</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Niet klinisch gevalideerd:</strong> Dit model is gericht op zelfexploratie, niet diagnostiek</li>
      </ul>
      <h2 style={S.h2}>8. Beperkingen van het AI-Model</h2>
      <div style={S.warn}>
        <h3 style={{...S.h3, color: '#f97316'}}>🔴 Dit AI-model kan NIET:</h3>
        <ul style={S.ul}>
          <li style={S.li}>Klinische diagnoses stellen (ADHD, depressie, angststoornis, etc.)</li>
          <li style={S.li}>Toekomstig gedrag voorspellen met zekerheid</li>
          <li style={S.li}>Medische of psychiatrische aandoeningen detecteren</li>
          <li style={S.li}>Counseling of psychotherapie vervangen</li>
          <li style={S.li}>Universeel geldend zijn voor alle culturen en contexten</li>
          <li style={S.li}>Interpersonele of zakelijke problemen oplossen</li>
        </ul>
      </div>
      <h2 style={S.h2}>9. Privacy & AI-Transparantie</h2>
      <ul style={S.ul}>
        <li style={S.li}>Originele antwoorden worden gescheiden van je profiel</li>
        <li style={S.li}>Het AI-model verwerkt geanonimiseerde batch-data</li>
        <li style={S.li}>Geen real-time persoonlijk monitoring</li>
        <li style={S.li}>90-daagse retentie met automatische verwijdering</li>
        <li style={S.li}>Geen overdracht naar trainingsdata voor toekomstige modellen</li>
      </ul>
      <h2 style={S.h2}>10. AI-Verbeteringen & Retraining</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔄 <strong style={S.strong}>Anonieme feedback:</strong> Gebruikers kunnen hun profielnauwkeurigheid beoordelen</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Periodieke retraining:</strong> Het model wordt jaarlijks gehertraind met nieuwe inzichten</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Transparante updates:</strong> Grote veranderingen worden aangekondigd en gedocumenteerd</li>
      </ul>
      <h2 style={S.h2}>11. Bescherming tegen AI-Misbruik</h2>
      <ul style={S.ul}>
        <li style={S.li}>🛡️ <strong style={S.strong}>Geen commerciële profilage:</strong> Resultaten worden niet verkocht aan adverteerders</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>Geen AI-training:</strong> Jouw data voedert geen concurrerende AI-modellen</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>Geen manipulatie:</strong> AI mag niet gebruikt worden om jou te manipuleren</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>Geen persoonlijkheidshacking:</strong> Het model mag niet gebruikt worden om exploitatie te ontdekken</li>
      </ul>
      <h2 style={S.h2}>12. Rechtmatige Basis</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Uw toestemming:</strong> Uitdrukkelijke opt-in voor psychologische profielering (Art. 9 AVG)</li>
        <li style={S.li}><strong style={S.strong}>Contractuitvoering:</strong> U accepteert dat AI de assessment-service levert</li>
        <li style={S.li}><strong style={S.strong}>Gerechtvaardigd belang:</strong> Productverbetering (geanonimiseerd)</li>
      </ul>
      <h2 style={S.h2}>13. Uw Rechten met AI-Verwerking</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Inzage:</strong> Exact zien welke features het model gebruikte</li>
        <li style={S.li}>✅ <strong style={S.strong}>Bezwaar:</strong> Tegen automatische profilering</li>
        <li style={S.li}>✅ <strong style={S.strong}>Verwijdering:</strong> Al je gegevens permanent verwijderd</li>
        <li style={S.li}>✅ <strong style={S.strong}>Menselijke review:</strong> Door een gekwalificeerde counselor, niet alleen AI</li>
      </ul>
      <h2 style={S.h2}>14. Klachten & Escalatie</h2>
      <ol style={S.ol}>
        <li style={S.li}>Email: ai-transparency@gardenforlife.nl</li>
        <li style={S.li}>Ontvang respons van ons AI-ethics team binnen 48 uur</li>
        <li style={S.li}>Dien klacht in bij je nationale AI-toezichthoudende autoriteit</li>
      </ol>
      <h2 style={S.h2}>15. Toekomstige AI-Verbeteringen</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔮 Multilinguale ondersteuning</li>
        <li style={S.li}>🔮 Cross-culturele validatie</li>
        <li style={S.li}>🔮 Neurowetenschappelijke integratie (waar geschikt)</li>
        <li style={S.li}>🔮 Verbeterde explainability (waarom deze profile?)</li>
      </ul>
      <h2 style={S.h2}>16. Contact</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> ai-transparency@gardenforlife.nl<br/><strong style={S.strong}>Onderwerp:</strong> "AI-transparantie vraag" of "AI-bezwaar"<br/><strong style={S.strong}>Verwachte respons:</strong> 48 uur</p>
    </>
  ),

  ip: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. Overzicht</h2>
      <p style={S.p}>Garden for Life is eigenaar van alle intellectueel-eigendomsrechten (IE-rechten) op het assessment-platform, inclusief het Deltawerken Model, de visuele archetypekaarten, AI-algoritmen, en onderliggende databases.</p>
      <h2 style={S.h2}>2. Het Deltawerken Model</h2>
      <p style={S.p}>Het Deltawerken Model is een eigen psychologisch raamwerk dat:</p>
      <ul style={S.ul}>
        <li style={S.li}>Gebaseerd is op Jungische archetypen en moderne persoonlijkheidsonderzoeken</li>
        <li style={S.li}>Een duaal-kernstructuur gebruikt (primair + secundair archetype)</li>
        <li style={S.li}>Schaduw- en blinde-vlekprofielen integreert</li>
        <li style={S.li}>Maatwerk aanbevelingen genereert voor persoonlijke groei</li>
      </ul>
      <div style={S.box}>
        <h3 style={S.h3}>🔒 Beschermd Immateriëel Goed</h3>
        <ul style={S.ul}>
          <li style={S.li}>📜 <strong style={S.strong}>Auteursrecht:</strong> Nederlandse en EU-auteursrechtwetgeving</li>
          <li style={S.li}>🔐 <strong style={S.strong}>Handelsgeheimen:</strong> De precieze formules en AI-gewichten zijn vertrouwelijk</li>
          <li style={S.li}>™ <strong style={S.strong}>Handelsmerken:</strong> "Garden for Life", "Deltawerken", alle logobeeldmerken</li>
          <li style={S.li}>🛡️ <strong style={S.strong}>Patentkandidaten:</strong> Onderzocht voor mogelijk EU Patent</li>
        </ul>
      </div>
      <h2 style={S.h2}>3. Wat Is Beschermd</h2>
      <h3 style={S.h3}>3.1 Beschermde Inhoud</h3>
      <ul style={S.ul}>
        <li style={S.li}>De volledige tekstcontent van het Deltawerken Model</li>
        <li style={S.li}>De twaalf archetypen en hun beschrijvingen</li>
        <li style={S.li}>Archetypecombinaties (duale-kernmodellen)</li>
        <li style={S.li}>Schaduw- en blinde-vlekprofielen</li>
        <li style={S.li}>Aanbevelingsalgoritmes</li>
        <li style={S.li}>Alle visuele elementen (kleuren, iconen, infographics)</li>
        <li style={S.li}>De assessment-vragenlijst en scoring-logica</li>
        <li style={S.li}>AI-trainingsdata en model-architectuur</li>
      </ul>
      <h3 style={S.h3}>3.2 NIET Beschermd</h3>
      <ul style={S.ul}>
        <li style={S.li}>Het begrip "psychologische archetypen" zelf (openbare kennis)</li>
        <li style={S.li}>Algemene persoonlijkheidscategorieën (Big Five, MBTI referenties)</li>
        <li style={S.li}>Jungische concepten uit het openbare domein</li>
        <li style={S.li}>Generieke persoonlijkheidsvocabulaire ("introvert", "empath")</li>
      </ul>
      <h2 style={S.h2}>4. Wat Je Mag Doen</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ Garden for Life-platform voor persoonlijk gebruik</li>
        <li style={S.li}>✅ Je eigen rapportage downloaden en opslaan (PDF)</li>
        <li style={S.li}>✅ Jouw profiel delen met vrienden, therapisten, coaches</li>
        <li style={S.li}>✅ Je archetype-label gebruiken in persoonlijke context</li>
        <li style={S.li}>✅ Jouw voortgang en inzichten reflecteren</li>
        <li style={S.li}>✅ Garden for Life-resultaten refereren in persoonlijkheidsonderzoeken</li>
      </ul>
      <h2 style={S.h2}>5. Wat Je NIET Mag Doen</h2>
      <div style={S.warn}>
        <h3 style={{...S.h3, color: '#f97316'}}>🔴 Verboden Activiteiten</h3>
        <ul style={S.ul}>
          <li style={S.li}>❌ <strong style={S.strong}>Commercieel hergebruik:</strong> Inhoud verkopen of verhuren zonder licentie</li>
          <li style={S.li}>❌ <strong style={S.strong}>AI-training:</strong> Data gebruiken om concurrerende AI-modellen te trainen</li>
          <li style={S.li}>❌ <strong style={S.strong}>Namaak/Afleiding:</strong> Copycat-sites of -apps maken op basis van ons model</li>
          <li style={S.li}>❌ <strong style={S.strong}>Reverse-engineering:</strong> Het AI-model of algoritmen reconstrueren</li>
          <li style={S.li}>❌ <strong style={S.strong}>Bulkverkopers:</strong> Massaal assessments afnemen voor wederverkoop</li>
          <li style={S.li}>❌ <strong style={S.strong}>Bedrijfstraining zonder licentie:</strong> Deltawerken Model gebruiken voor zakelijke coaching</li>
          <li style={S.li}>❌ <strong style={S.strong}>Publicatie:</strong> Archetypebeschrijvingen reproduceren zonder toestemming</li>
          <li style={S.li}>❌ <strong style={S.strong}>Logo-eigendom:</strong> Garden for Life-logo's klonen of nadoen</li>
        </ul>
      </div>
      <h2 style={S.h2}>6. Licenties voor Professioneel Gebruik</h2>
      <p style={S.p}>Als je Garden for Life commercieel wilt gebruiken, heb je een licentie nodig:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Eindgebruiker-licentie:</strong> Voor individuele coaches/therapeuten</li>
        <li style={S.li}><strong style={S.strong}>Bedrijfslicentie:</strong> Voor bedrijven/trainingsorganisaties</li>
        <li style={S.li}><strong style={S.strong}>Bèta-licentie:</strong> Voor onderzoeks- en feedbackdoeleinden</li>
        <li style={S.li}><strong style={S.strong}>OEM-licentie:</strong> Voor integratie in andere platforms</li>
      </ul>
      <p style={S.p}>Voor licentieaanvragen: <strong style={S.strong}>licenses@gardenforlife.nl</strong></p>
      <h2 style={S.h2}>7. Misbruik-Bescherming</h2>
      <ul style={S.ul}>
        <li style={S.li}>🛡️ <strong style={S.strong}>Namaak-detectie:</strong> Actief scanning voor copycat-sites</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>Digital Watermarking:</strong> Alle PDF-exports hebben verborgen ID</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>Juridische handhaving:</strong> We zetten juridische stappen tegen inbreuk</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>DMCA-partners:</strong> Google, Meta en andere platforms notificaties voor inbreuken</li>
      </ul>
      <h2 style={S.h2}>8. Gebruikersgegenereerde Inhoud</h2>
      <ul style={S.ul}>
        <li style={S.li}>Je behoudt het eigendom van je eigen inhoud</li>
        <li style={S.li}>Je geeft Garden for Life het recht om het te publiceren/promoten</li>
        <li style={S.li}>Garden for Life is eigenaar van afgeleide analyses (anoniem geanonimiseerd)</li>
      </ul>
      <h2 style={S.h2}>9. Merken & Logo's</h2>
      <p style={S.p}>De volgende zijn geregistreerde handelsmerken van Garden for Life:</p>
      <ul style={S.ul}>
        <li style={S.li}>™ Garden for Life</li>
        <li style={S.li}>™ Deltawerken</li>
        <li style={S.li}>™ Eyedentity</li>
        <li style={S.li}>™ Duaal-kernmodel</li>
        <li style={S.li}>Alle bijbehorende logobeeldmerken en visuele identiteit</li>
      </ul>
      <h2 style={S.h2}>10. Derde-Partij Componenten</h2>
      <p style={S.p}>Garden for Life gebruikt open-source en licentiegebonden software:</p>
      <ul style={S.ul}>
        <li style={S.li}>React, Node.js, MongoDB: Open-source licenties</li>
        <li style={S.li}>jsPDF, Chart.js: Respectievelijke licenties</li>
        <li style={S.li}>Google Cloud: Commerciële licentie</li>
      </ul>
      <h2 style={S.h2}>11. Auteursrecht Inbreuken Melden</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> legal@gardenforlife.nl<br/><strong style={S.strong}>Onderwerp:</strong> "IE-inbreuk melden"<br/>Bevat: locatie van inbreuk (URL), beschrijving, contactgegevens. We reageren binnen 7 werkdagen.</p>
      <h2 style={S.h2}>12. DMCA & Copyright Notices</h2>
      <p style={S.p}>Garden for Life naleeft de Digital Millennium Copyright Act (DMCA) en EU Copyright Directive.</p>
      <h2 style={S.h2}>13. IE-Rechten & Duur</h2>
      <ul style={S.ul}>
        <li style={S.li}>Auteursrecht: 70 jaar na dood van oorspronkelijke auteur</li>
        <li style={S.li}>Patentkandidaten: 20 jaar van aanmeldingsdatum</li>
        <li style={S.li}>Handelsmerken: Zolang in gebruik/verlengd</li>
      </ul>
      <h2 style={S.h2}>14. Wijzigingen in IE-Rechten</h2>
      <p style={S.p}>Garden for Life kan IE-rechten updaten als nieuwe modellen zijn ontwikkeld, juridische omgeving verandert, of internationale uitbreidingen plaatsvinden.</p>
      <h2 style={S.h2}>15. Contact</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> legal@gardenforlife.nl<br/><strong style={S.strong}>Website:</strong> www.gardenforlife.nl/legal<br/><strong style={S.strong}>Verwachte respons:</strong> 5 werkdagen</p>
    </>
  ),

  usage: (
    <>
      <p style={S.updated}>Laatst bijgewerkt: 1 januari 2026</p>
      <h2 style={S.h2}>1. Doel van Dit Document</h2>
      <p style={S.p}>Dit document beschrijft <strong style={S.strong}>verboden activiteiten</strong> op het Platform en wat Garden for Life doet om misbruik te voorkomen. Het is aanvulling op onze Algemene Voorwaarden.</p>
      <h2 style={S.h2}>2. Principiële Verboden Activiteiten</h2>
      <h3 style={S.h3}>2.1 Commercieel Misbruik</h3>
      <div style={S.warn}>
        <p style={S.p}><strong style={S.strong}>VERBODEN:</strong> Garden for Life-resultaten of het Deltawerken Model commercieel uitbuiten zonder expliciete licentie.</p>
      </div>
      <ul style={S.ul}>
        <li style={S.li}>❌ <strong style={S.strong}>Consulting zonder licentie:</strong> Garden for Life gebruiken in betaalde coaching/consulting</li>
        <li style={S.li}>❌ <strong style={S.strong}>Bedrijfstraining:</strong> Het model gebruiken voor zakelijke teambuilding</li>
        <li style={S.li}>❌ <strong style={S.strong}>Therapeutische praktijk:</strong> Assessments aanbieden in klinische context</li>
        <li style={S.li}>❌ <strong style={S.strong}>Wederverkoop:</strong> Assessments kopen en doorverkopen aan anderen</li>
        <li style={S.li}>❌ <strong style={S.strong}>Onderlicentiëring:</strong> Andere bedrijven toestemming geven zonder toestemming</li>
      </ul>
      <h3 style={S.h3}>2.2 AI-Training & Data Misbruik</h3>
      <p style={S.p}><strong style={S.strong}>KRITIEK VERBODEN:</strong> Jouw Garden for Life-data mag NIET gebruikt worden voor AI-training.</p>
      <ul style={S.ul}>
        <li style={S.li}>❌ Garden for Life-resultaten voeden geen ChatGPT, Gemini of concurrerende modellen</li>
        <li style={S.li}>❌ Text-antwoorden niet analyseren voor stereotypes</li>
        <li style={S.li}>❌ Gebruiken om andere gebruikers te profileren</li>
        <li style={S.li}>❌ Predictive analytics op basis van jouw data</li>
        <li style={S.li}>❌ Biometrische extractie uit je antwoorden</li>
        <li style={S.li}>❌ Een unieke psychologische "vingerafdruk" creëren</li>
      </ul>
      <div style={S.box}>
        <h3 style={S.h3}>🔐 Garantie</h3>
        <ul style={S.ul}>
          <li style={S.li}>✅ Je gegevens NOOIT gebruikt voor AI-training</li>
          <li style={S.li}>✅ Open-source modellen hebben geen toegang</li>
          <li style={S.li}>✅ Concurrerende bedrijven (OpenAI, Google, Meta) geen toegang</li>
          <li style={S.li}>✅ Je data niet gebruikt voor LLM fine-tuning</li>
        </ul>
      </div>
      <h3 style={S.h3}>2.3 Manipulatie & Exploitatie</h3>
      <ul style={S.ul}>
        <li style={S.li}>❌ <strong style={S.strong}>Psychologische manipulatie:</strong> Resultaten gebruiken om zwakheden uit te buiten</li>
        <li style={S.li}>❌ <strong style={S.strong}>Gaslighting:</strong> Archetype-profiel gebruiken om verwarring te zaaien</li>
        <li style={S.li}>❌ <strong style={S.strong}>Coercion:</strong> Iemand dwingen zich te gedragen als hun "archetype" beschrijft</li>
        <li style={S.li}>❌ <strong style={S.strong}>Vernedering:</strong> Resultaten gebruiken om iemand uit te lachen</li>
        <li style={S.li}>❌ <strong style={S.strong}>Afpersing:</strong> Resultaten gebruiken als chantage</li>
      </ul>
      <h3 style={S.h3}>2.4 Platform-Integriteit</h3>
      <ul style={S.ul}>
        <li style={S.li}>❌ Hacking van het Platform of database</li>
        <li style={S.li}>❌ Massaal kopiëren van inhoud (scraping)</li>
        <li style={S.li}>❌ Spam-berichten aan andere gebruikers</li>
        <li style={S.li}>❌ Denial-of-service aanvallen</li>
        <li style={S.li}>❌ Phishing — gebruikers verleiden om credentials prijs te geven</li>
        <li style={S.li}>❌ Malware-verspreiding via het Platform</li>
      </ul>
      <h2 style={S.h2}>3. Opzettelijk Misbruik vs. Onachtzaamheid</h2>
      <table style={S.table}>
        <tbody>
          <tr><td style={{...S.td, color: '#c4b5fd'}}><strong>Opzettelijk misbruik</strong></td><td style={S.td}>Bewust tegen voorwaarden ingaan → Account-suspensie</td></tr>
          <tr><td style={{...S.td, color: '#c4b5fd'}}><strong>Onachtzaamheid</strong></td><td style={S.td}>Onwetend misbruik → Eerste waarschuwing + herstelmogelijkheid</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>4. Hoe We Misbruik Detecteren</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔍 <strong style={S.strong}>Automatische flagging:</strong> Verdacht gedrag (massale downloads, API-loops)</li>
        <li style={S.li}>🔍 <strong style={S.strong}>User reports:</strong> Gebruikers melden misbruik</li>
        <li style={S.li}>🔍 <strong style={S.strong}>AI-analyse:</strong> Patroonherkenning voor anomalieën</li>
        <li style={S.li}>🔍 <strong style={S.strong}>Log-analyse:</strong> Verdachte toegangsmasters en dataflows</li>
        <li style={S.li}>🔍 <strong style={S.strong}>Derde-partij monitoring:</strong> IP-reputatiescanning</li>
      </ul>
      <h2 style={S.h2}>5. Consequenties van Misbruik</h2>
      <h3 style={S.h3}>Eerste Schending: Waarschuwing</h3>
      <ul style={S.ul}>
        <li style={S.li}>📧 Email-waarschuwing met specifieke schending</li>
        <li style={S.li}>⏰ 7 dagen om te reageren/corrigeren</li>
        <li style={S.li}>🔒 Account kan beperkt worden</li>
      </ul>
      <h3 style={S.h3}>Tweede Schending: Suspensie</h3>
      <ul style={S.ul}>
        <li style={S.li}>🚫 Account tijdelijk (30 dagen) opgeschort</li>
        <li style={S.li}>📋 Gerechtigd bezwaar mogelijk</li>
        <li style={S.li}>📞 Contact met juridisch team vereist</li>
      </ul>
      <h3 style={S.h3}>Derde Schending: Permanente Verwijdering</h3>
      <ul style={S.ul}>
        <li style={S.li}>❌ Account permanent verwijderd</li>
        <li style={S.li}>💾 Alle gebruikersgegevens verwijderd</li>
        <li style={S.li}>⚖️ Mogelijke juridische stappen</li>
      </ul>
      <h2 style={S.h2}>6. Ernstige Schendingen (Onmiddellijke Actie)</h2>
      <ul style={S.ul}>
        <li style={S.li}>🚨 <strong style={S.strong}>Hacking/Cyberaanval:</strong> Onmiddellijk afsluiten + wetshandhaving</li>
        <li style={S.li}>🚨 <strong style={S.strong}>Seksueel misbruik:</strong> Onmiddellijk afsluiten + IP-ban</li>
        <li style={S.li}>🚨 <strong style={S.strong}>Bedreigingen/Geweld:</strong> Onmiddellijk afsluiten + politie</li>
        <li style={S.li}>🚨 <strong style={S.strong}>Kinderexploitatie:</strong> Onmiddellijk afsluiten + NCMEC rapportage</li>
        <li style={S.li}>🚨 <strong style={S.strong}>Groot Datalek:</strong> Onmiddellijk afsluiten + Onderzoek</li>
      </ul>
      <h2 style={S.h2}>7. Juridische Handhaving</h2>
      <ul style={S.ul}>
        <li style={S.li}>⚖️ <strong style={S.strong}>IP-inbreuken:</strong> DMCA-notices, IE-klachten</li>
        <li style={S.li}>⚖️ <strong style={S.strong}>Contractschending:</strong> Instellingsprocedures</li>
        <li style={S.li}>⚖️ <strong style={S.strong}>Criminaliteit:</strong> Rapportage bij wetshandhaving</li>
        <li style={S.li}>⚖️ <strong style={S.strong}>Datalekken:</strong> Civiele schadevergoeding</li>
      </ul>
      <h2 style={S.h2}>8. Gebruiker-tot-Gebruiker Bescherming</h2>
      <ul style={S.ul}>
        <li style={S.li}>🛡️ Andere gebruikers blokkeren</li>
        <li style={S.li}>🛡️ Misbruik aan beheerders rapporteren</li>
        <li style={S.li}>🛡️ Optie om profiel verborgen te houden</li>
        <li style={S.li}>🛡️ Assessmentgegevens delen is opt-in</li>
        <li style={S.li}>🛡️ Slecht gedrag wordt beheerd</li>
      </ul>
      <h2 style={S.h2}>9. Feedback & Herstel</h2>
      <ol style={S.ol}>
        <li style={S.li}>Stuur bezwaarschrift naar compliance@gardenforlife.nl</li>
        <li style={S.li}>Bevat bewijs, context, mitigerende omstandigheden</li>
        <li style={S.li}>Garden for Life zal onafhankelijk herzien</li>
        <li style={S.li}>Ontvang respons binnen 14 dagen</li>
        <li style={S.li}>Mogelijkheid tot escalatie</li>
      </ol>
      <h2 style={S.h2}>10. Voorkoming van Misbruik</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ Sterke wachtwoorden: Voorkom account-hijacking</li>
        <li style={S.li}>✅ Twee-factor authenticatie: Bescherming tegen ongeautoriseerde toegang</li>
        <li style={S.li}>✅ Privacy-instellingen: Controle wie jou kan zien</li>
        <li style={S.li}>✅ Assessmentgegevens niet met onbekenden delen</li>
        <li style={S.li}>✅ Verdacht gedrag onmiddellijk melden</li>
      </ul>
      <h2 style={S.h2}>11. Niet-Discriminatie</h2>
      <p style={S.p}>Garden for Life handhaaft deze voorwaarden zonder discriminatie op grond van geslacht, genderidentiteit, ras, ethnische afkomst, religie, nationaliteit, leeftijd, invaliditeit, seksuele oriëntatie of socio-economische status.</p>
      <h2 style={S.h2}>12. Wijzigingen in Beleid</h2>
      <ul style={S.ul}>
        <li style={S.li}>Grote wijzigingen (30 dagen notice)</li>
        <li style={S.li}>Kleine verduidelijkingen (dadelijk van toepassing)</li>
      </ul>
      <h2 style={S.h2}>13. Verantwoording & Transparantie</h2>
      <p style={S.p}>Garden for Life publiceert jaarlijks:</p>
      <ul style={S.ul}>
        <li style={S.li}>📊 Rapport over misbruik-casussen</li>
        <li style={S.li}>📊 Account-schorsing/verwijderingstatistieken</li>
        <li style={S.li}>📊 Reactie op klachten en bezwaren</li>
        <li style={S.li}>📊 Juridische verzoeken van overheden</li>
      </ul>
      <h2 style={S.h2}>14. Contact & Melding</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> abuse@gardenforlife.nl<br/><strong style={S.strong}>Onderwerp:</strong> "Misbruik melden" of "Account schending"<br/><strong style={S.strong}>Verwachte respons:</strong> 48 uur</p>
      <h2 style={S.h2}>15. Derde-Partij Rapportage</h2>
      <p style={S.p}>Als je ernstig misbruik wil rapporteren kan je ook contacteren:</p>
      <ul style={S.ul}>
        <li style={S.li}>🇳🇱 <strong style={S.strong}>Nederland:</strong> Autoriteit Persoonsgegevens (AP), NCMEC (kinderm. Inhoud)</li>
        <li style={S.li}>🇪🇺 <strong style={S.strong}>EU:</strong> Digital Services Coordinator, nationale NDB</li>
        <li style={S.li}>🌐 <strong style={S.strong}>Internationaal:</strong> Interpol, FBI (cybercrime)</li>
      </ul>
    </>
  ),

  retention: (
    <>
      <p style={S.updated}>Versie 1.0 — {new Date().toLocaleDateString('nl-NL')}</p>
      <p style={S.p}>Dit beleid beschrijft hoe lang Garden for Life jouw persoonsgegevens bewaart en hoe je verwijdering kunt aanvragen, in overeenstemming met de AVG (GDPR).</p>
      <h2 style={S.h2}>1. Bewaartermijnen per Gegevenscategorie</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Categorie</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Grondslag</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Accountgegevens</td><td style={S.td}>Tot verwijdering account + 30 dagen</td><td style={S.td}>Contractuele noodzaak</td></tr>
          <tr><td style={S.td}>Assessmentresultaten</td><td style={S.td}>Tot verwijdering account</td><td style={S.td}>Toestemming</td></tr>
          <tr><td style={S.td}>Bijzondere persoonsgegevens (Art. 9)</td><td style={S.td}>Tot intrekking toestemming</td><td style={S.td}>Expliciete toestemming</td></tr>
          <tr><td style={S.td}>Betaalgegevens</td><td style={S.td}>7 jaar</td><td style={S.td}>Wettelijke verplichting (belasting)</td></tr>
          <tr><td style={S.td}>Logbestanden / beveiliging</td><td style={S.td}>90 dagen</td><td style={S.td}>Gerechtvaardigd belang</td></tr>
          <tr><td style={S.td}>Backups</td><td style={S.td}>30 dagen na primaire verwijdering</td><td style={S.td}>Technische noodzaak</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>2. Jouw Recht op Verwijdering</h2>
      <p style={S.p}>Op grond van de AVG heb je het recht om verwijdering van jouw persoonsgegevens te verzoeken (<strong style={S.strong}>"recht op vergetelheid"</strong>). Wij handelen jouw verzoek af binnen <strong style={S.strong}>30 dagen</strong>.</p>
      <div style={S.box}>
        <p style={{...S.p, margin: 0}}><strong style={S.strong}>Verzoek indienen via:</strong><br/>📧 privacy@gardenforlife.nl<br/>Onderwerp: "Verzoek tot gegevensverwijdering"</p>
      </div>
      <h2 style={S.h2}>3. Uitzonderingen op Verwijdering</h2>
      <p style={S.p}>Wij kunnen verwijdering weigeren of uitstellen wanneer:</p>
      <ul style={S.ul}>
        <li style={S.li}>Er een wettelijke bewaarplicht van toepassing is (bijv. fiscale wetgeving)</li>
        <li style={S.li}>De gegevens noodzakelijk zijn voor een lopende juridische procedure</li>
        <li style={S.li}>Er een gerechtvaardigd belang bestaat dat zwaarder weegt dan jouw belang</li>
      </ul>
      <h2 style={S.h2}>4. Automatische Verwijdering</h2>
      <p style={S.p}>Na het verlopen van de bewaartermijn worden gegevens automatisch en veilig verwijderd of geanonimiseerd. Backupsystemen worden gesynchroniseerd binnen 30 dagen na primaire verwijdering.</p>
      <h2 style={S.h2}>5. Account Zelf Verwijderen</h2>
      <p style={S.p}>Je kunt je account en alle bijbehorende gegevens zelf verwijderen via je profielinstellingen. Na bevestiging wordt je account onmiddellijk gedeactiveerd en alle gegevens verwijderd binnen de hierboven genoemde termijnen.</p>
      <h2 style={S.h2}>6. Contact</h2>
      <p style={S.p}><strong style={S.strong}>Functionaris Gegevensbescherming:</strong><br/>📧 privacy@gardenforlife.nl<br/>📬 Garden for Life, Nederland</p>
    </>
  ),
};
