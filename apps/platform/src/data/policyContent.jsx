import React from 'react';
import { S, PolicyLink, RetentionForm } from './policyShared.jsx';

/**
 * Dutch policy documents. The English set lives in policyContent.en.jsx and
 * mirrors these keys exactly; getPolicyContent() in policyIndex.jsx selects
 * between them by active language.
 */

export const POLICY_CONTENT_NL = {
  terms: (
    <>
      <p style={S.updated}>Versiedatum: 27 september 2026 | Versie: 2.2</p>
      <p style={S.p}>Deze voorwaarden zijn van toepassing op het gebruik van het Garden For Life platform.</p>

      <h2 style={S.h2}>Artikel 1 — Definities</h2>
      <p style={S.p}>In deze Algemene Voorwaarden worden de volgende begrippen gehanteerd:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Garden For Life:</strong> Handelsnaam van de onderneming gevestigd te Zutphen, De Taxushaag 2, 7207MB, ingeschreven in het Handelsregister van de Kamer van Koophandel onder nummer 85125245. Hierna: 'Garden For Life', 'wij' of 'ons'.</li>
        <li style={S.li}><strong style={S.strong}>Platform:</strong> De website en digitale omgeving van Garden For Life, bereikbaar via https://gardenforlife.nl/, en de desktopapplicatie van Garden For Life (artikel 5b).</li>
        <li style={S.li}><strong style={S.strong}>Gebruiker:</strong> Iedere natuurlijke persoon van 16 jaar of ouder die gebruikmaakt van het Platform.</li>
        <li style={S.li}><strong style={S.strong}>Assessment:</strong> De digitale vragenlijst van 36 vragen (72 picks — 2 keuzes per vraag) op basis van het Garden For Life Deltawerken Model, die de Gebruiker invult om een persoonlijk zelfreflectierapport te genereren.</li>
        <li style={S.li}><strong style={S.strong}>Rapport:</strong> Het AI-gegenereerde persoonlijke zelfreflectierapport dat na voltooiing van de Assessment wordt aangemaakt op basis van de antwoorden van de Gebruiker.</li>
        <li style={S.li}><strong style={S.strong}>AVG:</strong> De Algemene Verordening Gegevensbescherming (EU) 2016/679.</li>
      </ul>

      <h2 style={S.h2}>Artikel 2 — Toepasselijkheid</h2>
      <ol style={S.ol}>
        <li style={S.li}>Deze Algemene Voorwaarden zijn van toepassing op alle gebruik van het Platform. Door gebruik te maken van het Platform verklaart de Gebruiker deze voorwaarden te hebben gelezen en te aanvaarden.</li>
        <li style={S.li}>Garden For Life behoudt zich het recht voor deze voorwaarden te wijzigen. Geregistreerde gebruikers worden hiervan per e-mail op de hoogte gesteld.</li>
        <li style={S.li}>Deze voorwaarden zijn opgesteld in het Nederlands. Bij eventuele vertaling prevaleert de Nederlandse tekst.</li>
      </ol>

      <h2 style={S.h2}>Artikel 3 — Toegang</h2>
      <ol style={S.ol} start={4}>
        <li style={S.li}>De Gebruiker dient minimaal 16 jaar oud te zijn. Door het Platform te gebruiken verklaart de Gebruiker aan deze leeftijdseis te voldoen. Garden For Life verifieert de opgegeven leeftijd niet, maar verwijdert een account zodra blijkt dat de Gebruiker jonger is dan 16 jaar.</li>
        <li style={S.li}>Het maken van de analyse en het downloaden van het korte Rapport zijn kosteloos. Het volledige Rapport kost eenmalig € 30,00 exclusief btw per Rapport (€ 36,30 inclusief 21% btw); tot de lente-equinox van maart 2027 geldt een introductieprijs van € 12,00 exclusief btw (€ 14,52 inclusief 21% btw). De Gebruiker betaalt het bedrag inclusief btw. Betaling verloopt via Stripe (Stripe Payments Europe, Limited), met iDEAL of creditcard. Bij de lancering is het volledige Rapport alleen te koop voor Gebruikers in Nederland; een betaling van buiten Nederland wordt automatisch teruggestort en geeft geen toegang tot het volledige Rapport. Het volledige Rapport kan ook worden vrijgegeven met een activatiecode van Garden For Life; een activatiecode is één keer te gebruiken en niet inwisselbaar voor geld. Het volledige Rapport wordt direct na betaling of activatie digitaal geleverd; de Gebruiker stemt daar bij de betaling uitdrukkelijk mee in en verliest daarmee het wettelijke herroepingsrecht. Garden For Life biedt daarnaast een geld-terug-garantie: binnen 14 dagen na betaling kan de Gebruiker via het contactformulier het volledige bedrag terugvragen, zonder opgave van reden. Bij terugbetaling wordt de kristal-code in dat Rapport geblokkeerd: de code geeft geen toegang meer tot het Platform. Is met die code een account geopend en is dit de enige lezing van dat account, dan wordt het account verwijderd; heeft het account ook lezingen uit andere Rapporten, dan wordt alleen de lezing van het terugbetaalde Rapport verwijderd en blijft de toegang uit die andere Rapporten volledig behouden. Op de vijftiende dag na de betaling verbreekt Garden For Life de koppeling tussen de betaling en het Rapport; is er op dat moment een terugbetaling in behandeling, dan blijft die koppeling ten hoogste 30 dagen langer bestaan (zie het Privacybeleid, artikel 6). Na het verbreken kan een betaling niet meer aan het Rapport of de kristal-code worden gekoppeld: een terugboeking via bank of creditcard blokkeert de code dan niet. Het e-mailadres waarmee de terugbetaling is gevraagd, wordt genoteerd. Bij een volgend terugbetalingsverzoek vanaf hetzelfde e-mailadres stelt een moderator van Garden For Life eerst enkele vragen over het verzoek, voordat over de terugbetaling wordt beslist. Rapporten die met een activatiecode zijn vrijgegeven, vallen niet onder de garantie.</li>
        <li style={S.li}>Garden For Life behoudt zich het recht voor de toegang van een Gebruiker te beëindigen of te beperken, zonder opgave van reden.</li>
      </ol>

      <h2 style={S.h2}>Artikel 4 — Aard van het Platform & AI-Gegenereerde Content</h2>
      <ol style={S.ol} start={8}>
        <li style={S.li}>Het Platform biedt een zelfreflectie-instrument op basis van het Garden For Life Deltawerken Model. Het Platform is uitsluitend bedoeld voor persoonlijke groei en zelfinzicht.</li>
        <li style={S.li}>Het Rapport is geen klinische diagnose, geen psychologisch advies en geen medisch oordeel. Het vervangt geen professionele psychologische, psychiatrische of medische begeleiding.</li>
        <li style={S.li}>De Rapporten worden volledig geautomatiseerd gegenereerd door een AI-model (Claude, ontwikkeld door Anthropic). Garden For Life is verantwoordelijk voor de configuratie van dit model, maar kan niet garanderen dat de gegenereerde inhoud in alle gevallen volledig accuraat of van toepassing is op de individuele situatie van de Gebruiker.</li>
        <li style={S.li}>De neurobiologische en psychologische concepten in het Rapport zijn interpretatieve metaforen binnen het Garden For Life Deltawerken Model. Zij vertegenwoordigen geen klinisch gemeten eigenschappen van de Gebruiker.</li>
        <li style={S.li}>De Gebruiker is zelf verantwoordelijk voor de interpretatie en het gebruik van het Rapport.</li>
        <li style={S.li}>Garden For Life biedt de mogelijkheid een persoonlijkheidsrapport te uploaden (zoals een OCEAN-rapport als PDF, DOCX of TXT; afbeeldingen worden niet geaccepteerd) ter verrijking van het assessmentrapport. Voordat de tekst wordt gelezen of aan het AI-model wordt aangeboden, verwijdert Garden For Life automatisch namen, e-mailadressen, telefoonnummers, postcodes en geboortedata en vervangt zij de bestandsnaam door een neutrale aanduiding; de oorspronkelijke bestandsnaam verlaat het apparaat van de Gebruiker niet. Deze automatische verwijdering herkent de gangbare vormen, maar kan niet garanderen dat elke persoonlijke vermelding wordt gevonden. De overige inhoud wordt verwerkt door het Claude AI-model (Anthropic, VS) en niet bewaard. Garden For Life is niet verantwoordelijk voor de persoonsgegevens of andere informatie die de Gebruiker opneemt in geüploade bestanden. De Gebruiker is zelf verantwoordelijk voor de inhoud van bestanden die hij of zij uploadt en voor de gevolgen daarvan. Garden For Life adviseert geen bestanden te uploaden met gevoelige persoonsgegevens van derden.</li>
      </ol>

      <h2 style={S.h2}>Artikel 5 — Het Rapport, de Kristal-code &amp; het Account</h2>
      <ol style={S.ol} start={14}>
        <li style={S.li}>Na voltooiing van de Assessment wordt het Rapport beschikbaar gesteld voor download. De gedownloade PDF is het enige exemplaar van de Gebruiker, bedoeld voor gebruik in diens eigen lokale werkomgeving; Garden For Life bewaart het volledige Rapport niet.</li>
        <li style={S.li}>Het volledige profiel waaruit het Rapport is opgebouwd — de ruwe antwoorden, de scores per archetype, de 5-mandje decompositie, de OCEAN-scores en de gegenereerde analyse — bestaat in één enkel exemplaar, uitsluitend in het werkgeheugen van het browsertabblad (of de applicatie) van de Gebruiker, en alleen gedurende de sessie. Voor het genereren van de analyse wordt het naar de server van Garden For Life en naar het AI-model Claude (Anthropic) verzonden; de server verwerkt het uitsluitend in het werkgeheugen en slaat het niet op. Dit geldt ongeacht of de Gebruiker is ingelogd. Garden For Life, de beheerder daaronder begrepen, heeft achteraf geen toegang tot de antwoorden, het volledige profiel of het Rapport van de Gebruiker en kan het Rapport niet opnieuw genereren of beschikbaar stellen.</li>
        <li style={S.li}>Het volledige Rapport bevat een unieke kristal-code; het korte Rapport niet. Het korte Rapport blijft gratis en downloadbaar. De code verschijnt pas in het Rapport nadat het is betaald of met een activatiecode is vrijgegeven — tot dat moment bestaat zij uitsluitend in versleutelde vorm, die de browser van de Gebruiker niet kan lezen. Wordt het Rapport niet vrijgegeven, dan wordt het in zijn geheel verwijderd zodra de Gebruiker de rapportpagina verlaat (door het tabblad te sluiten, de pagina te herladen of weg te navigeren): het volledige profiel en de versleutelde code verdwijnen uit het tabblad en de server verwijdert de kaarttekst die onder de hash van die code werd aangehouden. Komt dat verwijderingssignaal niet aan (bijvoorbeeld door een verbroken verbinding), dan verloopt de versleutelde code na 24 uur en verwijdert de nachtelijke opruiming om 00:00 (Europe/Amsterdam) de kaarttekst. Een niet-vrijgegeven Rapport kan daarom nooit later worden opgevraagd: het volledige Rapport kan uitsluitend éénmaal, direct na de Assessment, worden aangeschaft. Wil de Gebruiker later alsnog betalen of downloaden, dan dient hij of zij een nieuwe Assessment af te leggen. Een vrijgegeven code is levenslang geldig, maar kan slechts <strong style={S.strong}>éénmaal</strong> worden ingewisseld voor een account. Garden For Life bewaart uitsluitend een onomkeerbare hash van die code — nooit de code zelf — zodat een reeds ingewisselde code niet opnieuw kan worden gebruikt. Deze hash blijft bestaan zolang het account bestaat.</li>
        <li style={S.li}>De Gebruiker is zelf verantwoordelijk voor het bewaren van de PDF en de daarin opgenomen code. Wie over het bestand beschikt, kan toegang krijgen tot het bijbehorende account. Garden For Life adviseert het bestand te bewaren zoals men een wachtwoord bewaart.</li>
        <li style={S.li}>In het account van de Gebruiker wordt uitsluitend een <em>gedeeltelijk profiel</em> opgeslagen: de archetype-namen, de render-only orb-geometrie, de genormaliseerde 12-punts vormvector, een samenvatting van de mandjesverdeling per archetype (voor het wiel op de profielkaart) en de bijbehorende kaartteksten. Het gedeeltelijke profiel bevat geen ruwe antwoorden en geen volledige analyse. Een volledige beschrijving staat in het Privacybeleid, artikel 6.</li>
      </ol>

      <h2 style={S.h2}>Artikel 5a — Lokale Werkomgeving &amp; Toekomstige Hulpmiddelen</h2>
      <ol style={S.ol} start={19}>
        <li style={S.li}>Garden For Life stelt een lokale werkomgeving beschikbaar waarin het Rapport, een kopie van het gedeeltelijke profiel en — zodra die beschikbaar zijn — het volledige profiel en de uitkomsten van hulpmiddelen worden opgeslagen in een map op het eigen apparaat van de Gebruiker. Garden For Life heeft geen toegang tot die map en bewaart daarvan geen kopie.</li>
        <li style={S.li}>De Gebruiker verleent hiervoor eenmalig toestemming voor één specifieke map. Die toestemming geldt uitsluitend voor die map en kan op elk moment worden ingetrokken. Een map hoort bij één account: bij het kiezen koppelt de applicatie de map aan het account van de Gebruiker, en zij weigert een map die al aan een ander account is gekoppeld.</li>
        <li style={S.li}>Omdat Garden For Life geen kopie bewaart, is de Gebruiker zelf verantwoordelijk voor het veiligstellen van de map. Verlies van de map — door het wissen van gegevens, een defect apparaat of het verplaatsen van bestanden — betekent onherstelbaar verlies van de inhoud. Garden For Life kan deze gegevens niet herstellen.</li>
        <li style={S.li}>Garden For Life zal aanvullende hulpmiddelen aanbieden die met de gegevens in die map werken, zoals het opstellen van persoonlijke plannen, doelen en taken. Elk hulpmiddel vraagt <strong style={S.strong}>afzonderlijk</strong> om toestemming, waarbij vooraf wordt vermeld welke gegevens het gebruikt en welke gegevens daarbij naar Garden For Life worden verzonden. Een hulpmiddel waarvoor geen toestemming is verleend, wordt niet uitgevoerd. Hulpmiddelen die met persoonsgegevens werken, zijn uitsluitend in de applicatie beschikbaar. Heeft een hulpmiddel rekenkracht van Garden For Life nodig (bijvoorbeeld een AI-model), dan verstuurt de applicatie dat verzoek <strong style={S.strong}>anoniem</strong>: zonder inloggegevens, zonder cookies en zonder gegevens die naar de Gebruiker, het account, het apparaat of de map verwijzen. Toegang wordt aangetoond met eenmalig bruikbare, blind ondertekende toegangsbewijzen, die Garden For Life niet aan het account kan koppelen waarvoor zij zijn uitgegeven. Invoer en uitkomst van zo'n verzoek worden niet bewaard. Een beschrijving staat in het Privacybeleid, artikel 6.</li>
        <li style={S.li}>Het Deltawerken Model, het bijbehorende corpus en de instructielaag blijven bij Garden For Life en worden niet in de lokale werkomgeving geplaatst.</li>
      </ol>

      <h2 style={S.h2}>Artikel 5b — De Desktopapplicatie</h2>
      <ol style={S.ol} start={24}>
        <li style={S.li}>De desktopapplicatie is het volledige Platform, aangevuld met toegang tot de werkmap, en is beschikbaar voor Windows, macOS en Linux. De Gebruiker downloadt en installeert haar zelf. Voor het gebruik is een internetverbinding nodig. De website blijft zonder installatie bruikbaar voor de Assessment, het Rapport, het account, het openbare profiel, Verbonden en berichten; de werkmap en de hulpmiddelen die met persoonsgegevens werken vereisen de applicatie en zijn op de website vergrendeld.</li>
        <li style={S.li}>De applicatie maakt bij de eerste start één werkmap aan in de gebruikersmap van de Gebruiker (&quot;Garden For Life&quot;) en krijgt uitsluitend toegang tot die map. De Gebruiker kan de werkmap verplaatsen naar een andere locatie of een bestaande werkmap opnieuw koppelen; de applicatie werkt dan alleen in die map. Zij doorzoekt het apparaat niet, benadert geen andere mappen en verzendt geen bestandsoverzichten naar Garden For Life. De applicatie onthoudt uitsluitend de locatie van die map, in haar eigen gegevensmap op het apparaat.</li>
        <li style={S.li}>Gedurende de testfase wordt de applicatie uitgebracht <strong style={S.strong}>zonder uitgeverscertificaat</strong>. Windows en macOS tonen daardoor bij installatie een waarschuwing dat de uitgever niet geverifieerd kan worden. Dit is een eigenschap van de distributie, geen indicatie van schadelijke software. Installeer de applicatie uitsluitend via de officiële downloadlink van Garden For Life en nooit via een kopie uit een andere bron.</li>
        <li style={S.li}>De applicatie controleert bij het opstarten en daarna elke vier uur via downloads.gardenforlife.nl of er een nieuwe versie is, downloadt die op de achtergrond en installeert haar wanneer de Gebruiker de applicatie herstart of afsluit. Bij die controle worden geen accountgegevens verzonden; zoals bij elk internetverzoek ziet de server het IP-adres en de versie van de applicatie. Zolang de applicatie zonder uitgeverscertificaat wordt uitgebracht, kan zij zichzelf op macOS niet bijwerken; de Gebruiker installeert een nieuwe versie dan zelf via de officiële downloadlink. Updates kunnen de indeling van de werkmap wijzigen; er wordt in dat geval eerst een kopie van de bestaande map gemaakt voordat de wijziging wordt doorgevoerd.</li>
        <li style={S.li}>Het verwijderen van de applicatie verwijdert de werkmap <strong style={S.strong}>niet</strong>. De map en de inhoud daarvan blijven op het apparaat van de Gebruiker staan totdat deze die zelf wist.</li>
        <li style={S.li}>Garden For Life is niet aansprakelijk voor gegevensverlies in de lokale werkomgeving, noch voor schade die voortvloeit uit het gebruik van de applicatie op een apparaat dat de Gebruiker met anderen deelt of dat niet met een wachtwoord is beveiligd.</li>
      </ol>

      <h2 style={S.h2}>Artikel 6 — Verwerking van Persoonsgegevens</h2>
      <ol style={S.ol} start={30}>
        <li style={S.li}>Garden For Life verwerkt persoonsgegevens van de Gebruiker conform de AVG en het geldende Privacybeleid van Garden For Life, te raadplegen via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink>.</li>
        <li style={S.li}>De Assessment genereert psychologische profieldata als bedoeld in artikel 9 AVG. De Gebruiker geeft hiervoor uitdrukkelijke toestemming via het toestemmingsscherm voorafgaand aan de Assessment.</li>
        <li style={S.li}>De Gebruiker heeft het recht de verleende toestemming op elk moment in te trekken via het contactformulier of e-mail. Intrekking leidt tot verwijdering van alle profieldata binnen 30 dagen.</li>
        <li style={S.li}>Voor vragen over gegevensverwerking kan de Gebruiker contact opnemen via <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</li>
        <li style={S.li}>Voor een volledig overzicht van verwerkingen, bewaartermijnen en rechten verwijzen wij naar ons Privacybeleid via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink> en de pagina Gegevensbehoud & Verwijdering via <PolicyLink to="/gegevensbehoud-en-verwijdering">gardenforlife.nl/gegevensbehoud-en-verwijdering</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Artikel 7 — Intellectueel Eigendom</h2>
      <ol style={S.ol} start={35}>
        <li style={S.li}>Alle intellectuele eigendomsrechten op het Platform, de assessmentmethodiek, het Garden For Life Deltawerken Model, de archetypensystematiek, de visuele archetypemodellen en de gegenereerde rapportstructuur berusten uitsluitend bij Garden For Life.</li>
        <li style={S.li}>Het gegenereerde Rapport is uitsluitend bestemd voor persoonlijk gebruik van de Gebruiker. Commerciële exploitatie, reproductie of verspreiding van het Rapport of onderdelen daarvan zonder voorafgaande schriftelijke toestemming van Garden For Life is niet toegestaan.</li>
        <li style={S.li}>Voor een volledig overzicht van beschermde werken, toegestaan gebruik en verboden misbruik — waaronder commerciële exploitatie, manipulatief misbruik van resultaten en AI-training — verwijst Garden For Life naar de pagina Gebruiksvoorwaarden & Misbruikbeleid via <PolicyLink to="/gebruiksvoorwaarden-misbruik">gardenforlife.nl/gebruiksvoorwaarden-misbruik</PolicyLink> en de pagina Intellectueel Eigendom via <PolicyLink to="/intellectueel-eigendom">gardenforlife.nl/intellectueel-eigendom</PolicyLink>.</li>
        <li style={S.li}>De Gebruiker verleent Garden For Life een beperkte, niet-exclusieve licentie om de ingevoerde assessmentdata te verwerken ten behoeve van de rapportgeneratie.</li>
      </ol>

      <h2 style={S.h2}>Artikel 8 — Aansprakelijkheid</h2>
      <ol style={S.ol} start={39}>
        <li style={S.li}>Garden For Life spant zich in het Platform naar behoren te laten functioneren, maar geeft geen garantie voor ononderbroken of foutloze werking.</li>
        <li style={S.li}>Garden For Life is niet aansprakelijk voor schade die voortvloeit uit het gebruik of de interpretatie van het Rapport, waaronder doch niet beperkt tot beslissingen op het gebied van werk, relaties, gezondheid of persoonlijk welzijn.</li>
        <li style={S.li}>Garden For Life is niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst.</li>
        <li style={S.li}>Voor zover aansprakelijkheid van Garden For Life niet volledig kan worden uitgesloten, is deze beperkt tot het bedrag dat de Gebruiker voor het betreffende Rapport heeft betaald. Voor kosteloos gebruik van het Platform is de aansprakelijkheid beperkt tot € 0.</li>
        <li style={S.li}>De Gebruiker vrijwaart Garden For Life van aanspraken van derden die voortvloeien uit het gebruik van het Platform door de Gebruiker.</li>
      </ol>

      <h2 style={S.h2}>Artikel 9 — Gedragsregels & Verboden Gebruik</h2>
      <p style={S.p}>Het is de Gebruiker niet toegestaan het Platform te gebruiken voor:</p>
      <ul style={S.ul}>
        <li style={S.li}>Doeleinden die in strijd zijn met de wet of de openbare orde</li>
        <li style={S.li}>Het geautomatiseerd uitlezen, kopiëren of scrapen van content</li>
        <li style={S.li}>Het omzeilen van beveiligingsmaatregelen</li>
        <li style={S.li}>Het delen van inloggegevens met derden</li>
        <li style={S.li}>Commerciële exploitatie van de rapportinhoud zonder toestemming</li>
      </ul>
      <p style={S.p}>Bij overtreding behoudt Garden For Life zich het recht voor de toegang van de Gebruiker onmiddellijk te beëindigen.</p>

      <h2 style={S.h2}>Artikel 10 — Beschikbaarheid & Wijzigingen</h2>
      <ol style={S.ol} start={44}>
        <li style={S.li}>Garden For Life behoudt zich het recht voor het Platform, de assessmentmethodiek of de rapportstructuur op elk moment te wijzigen, tijdelijk buiten gebruik te stellen of te beëindigen.</li>
        <li style={S.li}>Garden For Life streeft naar een beschikbaarheid van het Platform van minimaal 96% per maand, maar geeft hierover geen garantie.</li>
        <li style={S.li}>Gepland onderhoud wordt waar mogelijk vooraf gecommuniceerd via e-mail.</li>
        <li style={S.li}>Voor informatie over het gebruik van cookies verwijzen wij naar ons Cookiebeleid via <PolicyLink to="/cookiebeleid">gardenforlife.nl/cookiebeleid</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Artikel 11 — Toepasselijk Recht & Geschillen</h2>
      <ol style={S.ol} start={48}>
        <li style={S.li}>Op deze Algemene Voorwaarden en alle overeenkomsten tussen Garden For Life en de Gebruiker is Nederlands recht van toepassing.</li>
        <li style={S.li}>Geschillen worden in eerste instantie geprobeerd op te lossen via overleg. Indien dit niet slaagt, worden geschillen voorgelegd aan de bevoegde rechter in het arrondissement Zutphen.</li>
        <li style={S.li}>Onverminderd het voorgaande heeft de Gebruiker het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (AP) via www.autoriteitpersoonsgegevens.nl.</li>
      </ol>

      <h2 style={S.h2}>Artikel 12 — Gerelateerde Beleidsdocumenten</h2>
      <p style={S.p}>Aanvullend op deze Algemene Voorwaarden hanteert Garden For Life de volgende beleidsdocumenten. Deze documenten maken onderdeel uit van de overeenkomst tussen Garden For Life en de Gebruiker:</p>
      <table style={S.table}>
        <thead>
          <tr><th style={S.th}>Document</th><th style={S.th}>URL</th></tr>
        </thead>
        <tbody>
          <tr><td style={S.td}>Privacybeleid</td><td style={S.td}><PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink></td></tr>
          <tr><td style={S.td}>Cookiebeleid</td><td style={S.td}><PolicyLink to="/cookiebeleid">gardenforlife.nl/cookiebeleid</PolicyLink></td></tr>
          <tr><td style={S.td}>Gegevensbehoud & Verwijdering</td><td style={S.td}><PolicyLink to="/gegevensbehoud-en-verwijdering">gardenforlife.nl/gegevensbehoud-en-verwijdering</PolicyLink></td></tr>
          <tr><td style={S.td}>AI-Transparantie</td><td style={S.td}><PolicyLink to="/ai-transparantie">gardenforlife.nl/ai-transparantie</PolicyLink></td></tr>
          <tr><td style={S.td}>Intellectueel Eigendom</td><td style={S.td}><PolicyLink to="/intellectueel-eigendom">gardenforlife.nl/intellectueel-eigendom</PolicyLink></td></tr>
          <tr><td style={S.td}>Gebruiksvoorwaarden & Misbruikbeleid</td><td style={S.td}><PolicyLink to="/gebruiksvoorwaarden-misbruik">gardenforlife.nl/gebruiksvoorwaarden-misbruik</PolicyLink></td></tr>
          <tr><td style={S.td}>Verwerkingsregister (Art. 30 AVG)</td><td style={S.td}><PolicyLink to="/verwerkingsregister">gardenforlife.nl/verwerkingsregister</PolicyLink></td></tr>
        </tbody>
      </table>
      <p style={S.p}>Door gebruik te maken van het Platform verklaart de Gebruiker kennis te hebben genomen van alle bovenstaande documenten.</p>

      <h2 style={S.h2}>Artikel 13 — Contact</h2>
      <p style={S.p}>Voor vragen over deze Algemene Voorwaarden of het Platform:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community</li>
        <li style={S.li}><strong style={S.strong}>Adres:</strong> De Taxushaag 2, Zutphen, 7207MB</li>
        <li style={S.li}><strong style={S.strong}>KVK-nummer:</strong> 85125245</li>
        <li style={S.li}><strong style={S.strong}>BTW-nummer:</strong> NL004054423B17</li>
      </ul>
      <p style={{...S.p, marginTop: '2rem', borderTop: '1px solid rgba(255,174,0,0.15)', paddingTop: '1rem', opacity: 0.5, fontSize: 'max(9px, 0.4vw)'}}>
        Garden For Life — Algemene Voorwaarden 2.2 — 27 september 2026
      </p>
    </>
  ),

  privacy: (
    <>
      <p style={S.updated}>Versiedatum: 27 september 2026 | Versie 2.1</p>
      <h2 style={S.h2}>1. Inleiding</h2>
      <p style={S.p}>Garden for Life respecteert je privacy en is toegewijd aan het beschermen van je persoonsgegevens. Dit Privacybeleid beschrijft hoe wij je gegevens verzamelen, gebruiken, opslaan en beschermen in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en andere toepasselijke wetgeving.</p>
      <h2 style={S.h2}>2. Verantwoordelijke</h2>
      <p style={S.p}><strong style={S.strong}>Garden for Life</strong> is verantwoordelijk voor de verwerking van je persoonsgegevens.</p>
      <p style={S.p}>Voor vragen over je gegevens of je rechten, neem contact met ons op:</p>
      <ul style={S.ul}>
        <li style={S.li}>E-mail: yuanwullink30@gfl.community</li>
        <li style={S.li}>Website: www.gardenforlife.nl</li>
      </ul>
      <h2 style={S.h2}>3. Welke Gegevens Verzamelen We?</h2>
      <h3 style={S.h3}>3.1 Gegevens die je actief verschaft:</h3>
      <ul style={S.ul}>
        <li style={S.li}>Registratiegegevens: weergavenaam, e-mailadres, wachtwoord</li>
        <li style={S.li}>Profielgegevens: taalvoorkeur en, optioneel, leeftijd en land</li>
        <li style={S.li}>Assessmentantwoorden: je keuzes per vraag — verwerkt om je rapport te berekenen, niet opgeslagen (zie artikel 6)</li>
        <li style={S.li}>Communicatiegegevens: berichten aan andere gebruikers en feedback die je ons stuurt (met het e-mailadres dat je daarbij opgeeft — niet gekoppeld aan je account)</li>
        <li style={S.li}>Betaalgegevens (alleen bij het volledige rapport): het e-mailadres waarmee je het rapport opvraagt, de betaalreferentie, het bedrag en de btw, de datum, of er is terugbetaald, het land dat je opgeeft, het tijdstip van je akkoord met de voorwaarden (met de versie daarvan) en het tijdstip waarop je de PDF hebt opgeslagen. Je kaart- of rekeninggegevens voer je in het betaalformulier van onze betaalprovider Stripe in; die ontvangen wij niet</li>
      </ul>
      <h3 style={S.h3}>3.2 Gegevens die we automatisch verzamelen:</h3>
      <p style={S.p}>Garden For Life gebruikt geen analytics, geen trackers en geen advertentienetwerken. Wij bouwen geen profiel op van je surfgedrag. Wat automatisch wordt vastgelegd beperkt zich tot:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Browsertype (user-agent):</strong> vastgelegd op het moment dat je toestemming geeft en wanneer je feedback instuurt — als bewijs van dat moment</li>
        <li style={S.li}><strong style={S.strong}>Technische serverlogs</strong> van onze hostingpartij, die na korte tijd automatisch verlopen. Onze eigen logregels bevatten geen e-mailadressen</li>
        <li style={S.li}><strong style={S.strong}>Update-controle van de desktopapplicatie:</strong> bij het opstarten en daarna elke vier uur vraagt de applicatie bij downloads.gardenforlife.nl op of er een nieuwe versie is. Daarbij ziet de server, zoals bij elk internetverzoek, je IP-adres en de versie van de applicatie — geen accountgegevens</li>
        <li style={S.li}><strong style={S.strong}>Anonieme verzoeken van hulpmiddelen:</strong> zonder account, cookies of identificatoren — zie artikel 6, "Anonieme hulpmiddelen"</li>
      </ul>
      <p style={S.p}>Wij leggen géén bezochte pagina's vast, géén kliks, géén tijdsduur, géén geolocatie en géén apparaat-identificatoren.</p>

      <h3 style={S.h3}>3.3 Assessmentdata &amp; Profieldata (Art. 9 AVG)</h3>
      <p style={S.p}>De volgende gegevens worden verwerkt na uitdrukkelijke toestemming en vallen onder Art. 9 AVG:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Ruwe assessmentantwoorden:</strong> je individuele keuzes per vraag (responses array) — uitsluitend aanwezig in je eigen browsertabblad tijdens de sessie, niet opgeslagen</li>
        <li style={S.li}><strong style={S.strong}>Subjectresultaten per thema:</strong> geaggregeerde scores per van de 5 thema's (subjectResults)</li>
        <li style={S.li}><strong style={S.strong}>Archetype-scores:</strong> het berekende scoreprofiel per archetype (scores)</li>
        <li style={S.li}><strong style={S.strong}>Archetypedetails:</strong> de uitgewerkte archetypenanalyse inclusief 5-mandje decompositie per archetype — Nature Core, Green Hardware, Culture Core, Blue Feedback, Yellow Cognitief, Purple Schaduw (archetypeDetails)</li>
        <li style={S.li}><strong style={S.strong}>Volledig gegenereerd rapport:</strong> inclusief Main/Support Archetype, Extended Archetype, schaduw/blindspot analyse, tactische aanbevelingen en AI Agent Prompt</li>
        <li style={S.li}><strong style={S.strong}>Inhoud geüploade bestanden (uploadedFileContents):</strong> indien van toepassing — de geëxtraheerde tekst uit een persoonlijkheidsrapport dat je optioneel uploadt (PDF, DOCX of TXT; afbeeldingen worden niet geaccepteerd). Voordat de tekst wordt gelezen of aan het AI-model gaat, verwijdert onze server namen, e-mailadressen, telefoonnummers, postcodes en geboortedata, en krijgt het bestand een neutrale naam — je eigen bestandsnaam verlaat je apparaat niet. Garden For Life slaat de inhoud niet op; zij wordt uitsluitend verwerkt door het Claude AI-model voor rapportgeneratie. De automatische verwijdering vangt de gangbare vormen af, maar kan niet alles herkennen: je blijft zelf verantwoordelijk voor wat je uploadt.</li>
      </ul>
      <p style={S.p}>Bovenstaande data — samen met eventuele OCEAN-scores je <em>volledige profiel</em> — bestaat in één enkel exemplaar, uitsluitend in het werkgeheugen van je eigen browsertabblad en alleen tijdens je sessie. Om je analyse te genereren wordt het naar onze beveiligde server in Frankfurt en naar het Claude AI-model (Anthropic) gestuurd; de server verwerkt het in het werkgeheugen en <strong style={S.strong}>slaat het niet op</strong> — geen databaserecord, geen tijdelijke opslag. Dat geldt ook als je bent ingelogd. Garden For Life, ook de beheerder, heeft daardoor achteraf geen toegang tot je antwoorden, je volledige profiel of je rapport. Wat in je account achterblijft is uitsluitend het <em>gedeeltelijke profiel</em> — de gegevens die nodig zijn om je orb te tekenen en je account te vullen. Artikel 6 beschrijft precies wat dat is en hoe lang elk onderdeel blijft bestaan.</p>

      <h2 style={S.h2}>4. Doeleinden van Gegevensverwerking</h2>
      <p style={S.p}>Wij verwerken je gegevens voor de volgende doeleinden:</p>
      <ul style={S.ul}>
        <li style={S.li}>Levering van Assessmentdiensten en generatie van persoonlijke profielrapporten</li>
        <li style={S.li}>Accountbeheer en authenticatie</li>
        <li style={S.li}>Communicatie over de Diensten</li>
        <li style={S.li}>Afhandeling van betalingen, activatiecodes en de 14-dagen geld-terug-garantie</li>
        <li style={S.li}>Systeemverbeteringen (op basis van geanonimiseerde gegevens)</li>
        <li style={S.li}>Naleving van wettelijke verplichtingen</li>
        <li style={S.li}>Beveiliging tegen fraude en misbruik, waaronder misbruik van de geld-terug-garantie</li>
      </ul>
      <h2 style={S.h2}>5. Rechtsgrondslag voor Verwerking</h2>
      <p style={S.p}>De verwerking van je gegevens is gebaseerd op:</p>
      <ul style={S.ul}>
        <li style={S.li}>Uitvoering van een overeenkomst (gebruik van het Platform, de aankoop van het volledige rapport en de geld-terug-garantie)</li>
        <li style={S.li}>Uitdrukkelijke toestemming (voor Art. 9 psychologische data)</li>
        <li style={S.li}>Gerechtvaardigd belang (systeembeveiliging, fraudepreventie en de grijze lijst na een terugbetaling)</li>
        <li style={S.li}>Naleving van wettelijke verplichtingen (de fiscale bewaarplicht voor betalingen)</li>
      </ul>
      <h2 style={S.h2}>6. Opslag en Bewaringsduur</h2>
      <p style={S.p}>Garden For Life hanteert drie duidelijk gescheiden niveaus. Op onze server blijft uitsluitend bewaard wat onder niveau 1 valt, plus de betaalgegevens, toestemmingsregistraties, feedback, kaarttekst en de gegevens van anonieme toegangsbewijzen die hieronder afzonderlijk worden beschreven. Niveau 2 bestaat alleen tijdens je sessie in je eigen browsertabblad; niveau 3 wordt nooit opgeslagen.</p>

      <h3 style={S.h3}>Niveau 1 — Blijvend, zolang je account bestaat</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Gegeven</th><th style={S.th}>Waarom het moet blijven</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>E-mailadres en weergavenaam (versleuteld), wachtwoord-hash</td><td style={S.td}>Om je te laten inloggen en je account te herkennen</td></tr>
          <tr><td style={S.td}>De <strong style={S.strong}>hash</strong> van je kristal-code (SHA-256) — nooit de code zelf</td><td style={S.td}>Een code blijft levenslang geldig maar kan slechts één keer worden ingewisseld. Zonder deze hash zou dezelfde PDF een tweede account kunnen openen.</td></tr>
          <tr><td style={S.td}><strong style={S.strong}>Het gedeeltelijke profiel:</strong> de archetype-namen, de render-only orb-geometrie, de genormaliseerde 12-punts vormvector, een samenvatting van de mandjesverdeling per archetype (voor het wiel op je kaart) en de bijbehorende kaartteksten</td><td style={S.td}>Dit tekent je orb, vult je accountscherm en — als je je profiel op openbaar zet — je publieke kaart in de Verbonden-directory. Andere gebruikers moeten dit kunnen zien; daarom staat het op onze server en niet uitsluitend op jouw apparaat.</td></tr>
          <tr><td style={S.td}>Ontvangen berichten (versleuteld) — ook berichten van Garden For Life zelf, zoals het welkomstbericht bij een nieuw account — en verbond-verzoeken</td><td style={S.td}>Deze komen binnen terwijl jouw apparaat uit staat en moeten ergens landen</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>Niveau 2 — Alleen tijdens je sessie (niet opgeslagen)</h3>
      <p style={S.p}>Je <strong style={S.strong}>volledige profiel</strong> — je ruwe antwoorden, de themaresultaten, de scores per archetype, de 5-mandje decompositie, eventuele OCEAN-scores en de gegenereerde analyse of het volledige rapport — bestaat in <strong style={S.strong}>één enkel exemplaar</strong>: in het werkgeheugen van je eigen browsertabblad, en alleen zolang je sessie duurt. Om je analyse te genereren wordt het naar onze server en naar het Claude AI-model (Anthropic) gestuurd. Onze server verwerkt het in het werkgeheugen en slaat het <strong style={S.strong}>niet</strong> op: er is geen databaserecord, geen tijdelijke opslag en geen bewaartermijn. Dat geldt of je nu bent ingelogd of niet. Niemand bij Garden For Life — ook de beheerder niet — kan achteraf je antwoorden, je volledige profiel of je rapport inzien.</p>
      <p style={S.p}>Elk rapport eindigt op een van twee manieren:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Vrijgegeven</strong> — je hebt betaald via Stripe of een activatiecode gebruikt. Alleen dan verschijnt de kristal-code in je volledige rapport. Je downloadt de PDF; die PDF is je enige exemplaar, bedoeld voor gebruik in je eigen lokale werkmap. De code in een vrijgegeven rapport blijft levenslang geldig en kan één keer worden ingewisseld voor een account; wij bewaren daarvan uitsluitend de onomkeerbare SHA-256-hash.</li>
        <li style={S.li}><strong style={S.strong}>Niet vrijgegeven</strong> — zodra je de rapportpagina verlaat (tabblad sluiten, herladen of wegnavigeren) wordt het rapport in zijn geheel verwijderd: je volledige profiel verdwijnt uit het tabblad, samen met de versleutelde kristal-code, en onze server verwijdert de kaarttekst die hij onder de hash van die code aanhield. Alleen als dat verwijderingssignaal niet aankomt (bijvoorbeeld bij een verbroken verbinding) geldt een technisch vangnet: de versleutelde code verloopt na 24 uur en de nachtelijke opruiming om 00:00 (Europe/Amsterdam) verwijdert de kaarttekst.</li>
      </ul>
      <p style={S.p}>Een niet-betaald rapport kan dus nooit later worden opgehaald. Het volledige rapport kun je alleen éénmaal kopen, direct na de test; wil je later alsnog betalen of downloaden, dan doe je de test opnieuw. Het korte rapport blijft gratis en downloadbaar (het bevat geen kristal-code).</p>
      <p style={S.p}>Feedback die je ons vrijwillig stuurt (het reviewformulier) valt hier niet onder: die wordt wel op onze server bewaard, samen met het e-mailadres dat je opgeeft, 90 dagen lang, waarna zij automatisch wordt verwijderd. Feedback wordt <strong style={S.strong}>niet</strong> aan je account gekoppeld, en je archetype wordt er niet bij opgeslagen: dat gebruiken we alleen om de bevestigingsmail te formuleren.</p>

      <h3 style={S.h3}>Betalingen, activatiecodes en terugbetalingen</h3>
      <p style={S.p}>Het korte rapport is gratis. Voor het volledige rapport betaal je via Stripe (iDEAL of creditcard) of gebruik je een activatiecode. Het betaalformulier op onze pagina wordt door Stripe geladen: je kaart- of rekeninggegevens gaan rechtstreeks naar Stripe en komen niet bij ons terecht. Bij de lancering is het volledige rapport alleen te koop in Nederland.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Gegeven</th><th style={S.th}>Hoe lang</th><th style={S.th}>Waarom</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Vrijgaveregistratie tijdens de terugbetalingstermijn: betaalreferentie, bedrag en btw, datum, status (betaald of terugbetaald), het tijdstip waarop je de PDF hebt opgeslagen, het bewijs van je akkoord (tijdstip, versie van de voorwaarden en een hash van de akkoordtekst), eventuele antwoorden op vragen van een moderator en de <strong style={S.strong}>hash</strong> van de kristal-code in dat rapport</td><td style={S.td}>Tot dag 15 na de betaling. Loopt er dan een terugbetaling, of houdt een beheerder de koppeling vast omdat een terugbetaling nog wordt verwerkt: ten hoogste 30 dagen langer</td><td style={S.td}>Om een terugbetaling of geschil aan het juiste rapport te koppelen. Het akkoordbewijs en het downloadtijdstip tonen bij een geschil aan dat je akkoord gaf en het rapport ontving.</td></tr>
          <tr><td style={S.td}>Vrijgaveregistratie na de termijn — <strong style={S.strong}>ontkoppeld</strong>: alleen de <strong style={S.strong}>hash</strong> van de kristal-code, dat het rapport is vrijgegeven, of er is terugbetaald, en de datum afgerond op de maand. Betaalreferentie, bedrag, btw, akkoordbewijs, downloadtijdstip, e-mailadres en antwoorden zijn verwijderd</td><td style={S.td}>Zolang die kristal-code geldig blijft</td><td style={S.td}>Zonder deze registratie opent de code geen account. Omdat de betaalgegevens eruit zijn verwijderd, kan niemand bij Garden For Life nog zien welke betaling bij welk rapport of welke code hoort.</td></tr>
          <tr><td style={S.td}>Boekhouding: per betaling en per terugbetaling een genummerd betaalbewijs (PDF, zonder naam of e-mailadres) met betaalreferentie, bedrag, btw en het akkoordbewijs</td><td style={S.td}>7 jaar</td><td style={S.td}>De wet verplicht ons betalingen 7 jaar te bewaren. Na dag 15 is dit bewijs niet meer te koppelen aan je rapport of je kristal-code.</td></tr>
          <tr><td style={S.td}>Een betaalpoging: interne referentie, de hash van de kristal-code, het e-mailadres (versleuteld), het land dat je opgeeft, bedrag, btw en status</td><td style={S.td}>Onbetaald: 30 dagen. Betaald: tot 1 dag na de 14-dagen terugbetalingstermijn. Daarna automatisch verwijderd</td><td style={S.td}>Om de betaling aan het juiste rapport te koppelen, ook als je tabblad sluit terwijl je bank de betaling nog verwerkt.</td></tr>
          <tr><td style={S.td}>Het e-mailadres bij een betaling (versleuteld)</td><td style={S.td}>Tot de 14-dagen terugbetalingstermijn voorbij is (uiterlijk bij het ontkoppelen); daarna automatisch verwijderd</td><td style={S.td}>Om een terugbetalingsverzoek aan de juiste betaling te koppelen.</td></tr>
          <tr><td style={S.td}><strong style={S.strong}>Grijze lijst</strong> na een terugbetaling: het e-mailadres (versleuteld) en per terugbetaling de datum en de betaalreferentie</td><td style={S.td}>2 jaar na de laatste terugbetaling; daarna automatisch verwijderd</td><td style={S.td}>Om misbruik van de geld-terug-garantie te voorkomen.</td></tr>
          <tr><td style={S.td}>Activatiecodes</td><td style={S.td}>Tot gebruik; daarna als logboekregel (alleen tijdstip)</td><td style={S.td}>Een code is één keer bruikbaar. Bij het inwisselen leggen wij niets over jou vast.</td></tr>
        </tbody>
      </table>
      <p style={S.p}>Vraag je binnen 14 dagen je geld terug, dan wordt de kristal-code in dat rapport geblokkeerd. Heb je met die code een account geopend en is het de enige lezing in dat account, dan wordt het account verwijderd (zoals bij een gewone accountverwijdering). Heeft het account ook lezingen uit andere rapporten, dan wordt alleen de terugbetaalde lezing verwijderd en houd je de volledige toegang die je andere rapporten geven. Je e-mailadres komt op de grijze lijst, ook als je een account hebt. Dat betekent niet dat je niets meer kunt kopen: pas bij een volgend terugbetalingsverzoek stelt een moderator je eerst een paar vragen en beslist daarna — een mens, nooit een geautomatiseerd systeem.</p>
      <p style={S.p}><strong style={S.strong}>Ontkoppeling op dag 15.</strong> Op de vijftiende dag na je betaling verbreken wij de koppeling tussen de betaling en je rapport: de betaalgegevens verdwijnen uit de vrijgaveregistratie en blijven alleen in de boekhouding staan, waar ze niet meer naar je rapport of je code verwijzen. Loopt er op dat moment een terugbetaling, dan blijft de koppeling ten hoogste 30 dagen langer bestaan, zodat de terugbetaling kan worden afgerond; een beheerder kan dat ook doen als een terugbetaling nog wordt verwerkt. Na het ontkoppelen kan een terugboeking via je bank of creditcard niet meer aan je rapport worden gekoppeld en blokkeert zij je code niet.</p>

      <h3 style={S.h3}>Niveau 3 — Nooit opgeslagen</h3>
      <ul style={S.ul}>
        <li style={S.li}>De PDF die je uploadt. Die wordt in het werkgeheugen gelezen om de code en het gedeeltelijke profiel eruit te halen en daarna weggegooid — er wordt nooit een kopie op onze servers geschreven.</li>
        <li style={S.li}>De inhoud van een persoonlijkheidsrapport dat je optioneel uploadt (PDF, DOCX of TXT). Namen en contactgegevens worden eruit verwijderd voordat de tekst wordt gelezen; daarna wordt niets bewaard.</li>
        <li style={S.li}>Je ruwe antwoorden en je volledige profiel (scores, 5-mandje decompositie, OCEAN-scores en analyse) — niet op onze server en niet in de lokale opslag van je browser.</li>
        <li style={S.li}>Het gegenereerde rapport zelf. Jouw gedownloade PDF is het enige exemplaar dat blijft bestaan.</li>
        <li style={S.li}>De ruwe kristal-code. Bij je analyse krijgt je browser alleen een versleutelde kopie die hij niet kan lezen; de code zelf verschijnt pas in het volledige rapport nadat het is betaald of vrijgegeven. Wij bewaren uitsluitend de onomkeerbare hash daarvan.</li>
      </ul>

      <h3 style={S.h3}>De kaarttekst in je rapport</h3>
      <p style={S.p}>Bij het opstellen van je rapport schrijft het model twee korte teksten die bedoeld zijn voor je profielkaart in het account — een uitgebreide beschrijving van je gift en een samenvatting van je geometrie. Die twee teksten staan in het gegevensblok achter in het volledige rapport (de PDF), samen met een digitale handtekening van onze server. Wij bewaren ze <strong style={S.strong}>niet</strong>: tot je de code inwisselt bestaan ze alleen in je rapport.</p>
      <p style={S.p}>Wissel je de code in door de PDF te uploaden, dan leest onze server de teksten uit de PDF, net als de kristal-code zelf, en neemt ze op in je account — alleen als de handtekening klopt. Zo kan niemand de tekst op een openbare kaart vervangen door de PDF te bewerken; een bewerkte tekst wordt genegeerd. Voor rapporten van vóór 19 september 2026 bewaarde onze server deze teksten apart, gekoppeld aan de <em>hash</em> van de kristal-code en aan niets anders. Die kopie wordt verwijderd zodra de code wordt ingewisseld; bij een rapport dat niet is betaald of vrijgegeven verwijdert de nachtelijke opruiming om 00:00 (Europe/Amsterdam) haar.</p>

      <h3 style={S.h3}>Je eigen werkmap</h3>
      <p style={S.p}>De desktopapplicatie van Garden For Life is het volledige platform, met toegang tot één map op je <strong style={S.strong}>eigen apparaat</strong>: de applicatie maakt die aan in je gebruikersmap, en jij beheert en verplaatst hem. Daarin worden je rapporten (als &lt;datum&gt;-&lt;archetype&gt;.pdf) en een kopie van je gedeeltelijke profiel opgeslagen, en — zodra de hulpmiddelen beschikbaar zijn — je volledige profiel en wat de hulpmiddelen voor je maken. Een map hoort bij één account: de applicatie weigert een map die al aan een ander account is gekoppeld. De applicatie onthoudt alleen <em>waar</em> de map staat, in haar eigen gegevensmap op je apparaat. Wij hebben geen toegang tot de map en bewaren er geen kopie van; omdat wij geen kopie bewaren, ben je zelf verantwoordelijk voor het veiligstellen ervan. Het verwijderen van de applicatie laat de map staan.</p>

      <h3 style={S.h3}>Anonieme hulpmiddelen</h3>
      <p style={S.p}>Hulpmiddelen die met je persoonlijke gegevens werken, draaien in de applicatie. Hebben ze rekenkracht van ons nodig (bijvoorbeeld een AI-model), dan gaat dat verzoek <strong style={S.strong}>anoniem</strong>: zonder inloggegevens, zonder cookies en zonder gegevens die naar jou, je account, je apparaat of je map verwijzen. Om te laten zien dat je toegang hebt, gebruikt de applicatie eenmalig bruikbare toegangsbewijzen die wij blind ondertekenen (RFC 9474): wij zetten er een handtekening onder zonder ze te zien, zodat wij een gebruikt bewijs niet kunnen herleiden tot het account dat het ontving. De toegangsbewijzen staan lokaal in de applicatie. Invoer en uitkomst van een hulpmiddel worden niet gelogd en niet bewaard; je IP-adres is voor onze hostingpartij zichtbaar, maar wordt op deze route niet vastgelegd.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Gegeven</th><th style={S.th}>Hoe lang</th><th style={S.th}>Waarom</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Per account het <strong style={S.strong}>aantal</strong> uitgegeven toegangsbewijzen in een maand (nooit de bewijzen zelf)</td><td style={S.td}>Tot het einde van de volgende maand; daarna automatisch verwijderd</td><td style={S.td}>Om het maandelijkse maximum (300) te bewaken en alleen accounts met toegang bewijzen te geven.</td></tr>
          <tr><td style={S.td}>Een SHA-256-hash van elk gebruikt toegangsbewijs, zonder tijdstip of account</td><td style={S.td}>Tot het einde van de volgende maand; daarna automatisch verwijderd</td><td style={S.td}>Zodat een bewijs maar één keer bruikbaar is.</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>7. Ontvangers / Doorgifte</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Ontvanger</th><th style={S.th}>Rol</th><th style={S.th}>Verwerkersovereenkomst</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Anthropic (Claude API)</td><td style={S.td}>Verwerker — assessmentdata wordt doorgegeven voor rapportgeneratie; een geüpload persoonlijkheidsrapport alleen nadat namen en contactgegevens zijn verwijderd; verzoeken van hulpmiddelen zonder gegevens over de gebruiker</td><td style={S.td}>Automatisch van kracht via acceptatie van Anthropic Commercial Terms of Service — maart 2026</td></tr>
          <tr><td style={S.td}>MongoDB Atlas</td><td style={S.td}>Verwerker — databaseopslag in Frankfurt (EU)</td><td style={S.td}>Aanwezig via Atlas-platform DPA (online acceptatie)</td></tr>
          <tr><td style={S.td}>Render.com</td><td style={S.td}>Verwerker — hosting van de applicatieserver (regio Frankfurt, EU). Alle verzoeken lopen hierlangs; er wordt geen profieldata op de host bewaard.</td><td style={S.td}>Aanwezig via Render DPA (online acceptatie)</td></tr>
          <tr><td style={S.td}>Cloudflare</td><td style={S.td}>Verwerker — uitlevering van de website (CDN) en DNS, en opslag en uitlevering van de installatiebestanden en updates van de desktopapplicatie (downloads.gardenforlife.nl)</td><td style={S.td}>Automatisch via Self-Serve Subscription Agreement</td></tr>
          <tr><td style={S.td}>Google Workspace</td><td style={S.td}>Verwerker — verzending van e-mail (bevestigingen, verificatielinks, de bevestiging van je feedback en de toegangsmail bij je rapport)</td><td style={S.td}>Gedekt door Google Workspace DPA</td></tr>
          <tr><td style={S.td}>Stripe Payments Europe, Limited (Dublin, Ierland, EU)</td><td style={S.td}>Zelfstandig verwerkingsverantwoordelijke voor de betaling — verwerkt je betaalgegevens, voert de betaling en een eventuele terugbetaling uit, berekent de btw (Stripe Tax) en voert fraudecontroles uit. Wij geven Stripe het bedrag, een omschrijving, een willekeurige interne referentie en het land voor de btw-berekening door; wij ontvangen de betaalstatus, de betaalreferentie, het land van je betaalkaart of factuuradres en het btw-bedrag. Stripe kan gegevens doorgeven aan Stripe, Inc. in de Verenigde Staten op basis van het EU-VS Data Privacy Framework en standaardcontractbepalingen.</td><td style={S.td}>Niet van toepassing: Stripe verwerkt betaalgegevens onder eigen verantwoordelijkheid en eigen privacyverklaring [Verificatie aanbevolen]</td></tr>
        </tbody>
      </table>
      <p style={S.p}>Rapportgeneratie verloopt uitsluitend via Claude (Anthropic). De configuratie van het platform bevat aansluitingen voor andere AI-aanbieders; die worden in de productieomgeving niet gebruikt. Mocht dat veranderen, dan wordt deze lijst bijgewerkt vóórdat zij in gebruik worden genomen.</p>
      <p style={S.p}>Indien de gebruiker een persoonlijkheidsrapport uploadt (PDF, DOCX of TXT), wordt de geëxtraheerde tekst eveneens verwerkt door Claude — nadat onze server daar namen, e-mailadressen, telefoonnummers, postcodes en geboortedata uit heeft verwijderd en het bestand een neutrale naam heeft gegeven. Afbeeldingen worden niet geaccepteerd en gaan nooit naar het model. De automatische verwijdering vangt de gangbare vormen af; persoonlijke informatie die zij niet herkent, bereikt Anthropic wel. Garden For Life is niet verantwoordelijk voor de persoonsgegevens die de gebruiker opneemt in geüploade bestanden. Gebruikers worden hierop gewezen in het toestemmingsscherm en bij het uploadmoment.</p>
      <h2 style={S.h2}>8. Je Rechten</h2>
      <p style={S.p}>Onder de AVG heb je de volgende rechten:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Recht op inzage:</strong> Je kunt een kopie van je persoonsgegevens aanvragen</li>
        <li style={S.li}><strong style={S.strong}>Recht op rectificatie:</strong> Je kunt onjuiste gegevens laten corrigeren</li>
        <li style={S.li}><strong style={S.strong}>Recht op verwijdering:</strong> Je kunt verwijdering van je gegevens aanvragen ("recht om vergeten te worden"). Betaalregistraties bewaren wij, zolang de wet dat verplicht, ook na zo'n verzoek</li>
        <li style={S.li}><strong style={S.strong}>Recht op beperking:</strong> Je kunt verwerking van je gegevens beperken</li>
        <li style={S.li}><strong style={S.strong}>Recht op gegevensoverdraagbaarheid:</strong> Je kunt je gegevens in gestructureerd formaat ontvangen</li>
        <li style={S.li}><strong style={S.strong}>Recht op bezwaar:</strong> Je kunt bezwaar maken tegen bepaalde verwerkingen, waaronder je plaatsing op de grijze lijst</li>
      </ul>
      <p style={S.p}>Om deze rechten uit te oefenen, stuur een e-mail naar <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</p>
      <h2 style={S.h2}>9. Beveiliging</h2>
      <p style={S.p}>Wij implementeren de volgende technische en organisatorische maatregelen ter bescherming van je gegevens:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Versleuteling in transit:</strong> Alle verbindingen verlopen via TLS 1.2+ (HTTPS). Databaseverbindingen zijn eveneens versleuteld.</li>
        <li style={S.li}><strong style={S.strong}>Versleuteling at rest:</strong> Alle serverdata is versleuteld via AES-256-GCM (MongoDB Atlas standaard). Daarnaast worden e-mailadressen en weergavenamen aanvullend versleuteld op veldniveau met AES-256-GCM voordat zij worden opgeslagen.</li>
        <li style={S.li}><strong style={S.strong}>Toegangsbeperking:</strong> De database is afgeschermd met inloggegevens en netwerkregels; alleen de applicatieserver en de beheerder hebben toegang.</li>
        <li style={S.li}><strong style={S.strong}>Toestemmingsregistratie:</strong> Het moment waarop je toestemming geeft wordt met tijdstempel vastgelegd, zodat aantoonbaar is dat en waarvoor je toestemming hebt gegeven. Deze registraties worden 7 jaar bewaard als bewijs dat de verwerking rechtmatig was. De toestemming aan het begin van de test bevat geen account en geen e-mailadres; de toestemming bij het opslaan van je PDF bevat het e-mailadres dat je daar invult, het soort toestemming en je browsertype.</li>
        <li style={S.li}><strong style={S.strong}>Ontkoppeling in de tijd:</strong> Zolang je rapport open staat, stuurt het platform geen verzoeken met je accountgegevens; daarna pas na een willekeurige vertraging van 1,5 tot 4 minuten. Zo kan een rapport niet via het tijdstip aan je account worden gekoppeld. Voor hulpmiddelen geldt hetzelfde.</li>
        <li style={S.li}><strong style={S.strong}>Serverlocatie:</strong> Alle serverdata wordt opgeslagen op servers in Frankfurt, Duitsland (EU).</li>
        <li style={S.li}><strong style={S.strong}>Wachtwoordbeveiliging:</strong> Wachtwoorden worden versleuteld opgeslagen via bcrypt en zijn nooit leesbaar voor Garden For Life.</li>
        <li style={S.li}><strong style={S.strong}>Authenticatie:</strong> Het platform gebruikt JWT bearer tokens voor authenticatie — geen traditionele sessiecookies.</li>
        <li style={S.li}><strong style={S.strong}>CSRF-bescherming:</strong> CSRF-resistentie via JWT bearer token authenticatie (geen sessiecookies).</li>
      </ul>
      <h2 style={S.h2}>10. Klachten</h2>
      <p style={S.p}>Heb je een klacht over onze gegevensverwerking? Neem contact met ons op of dien een klacht in bij je nationale toezichthoudende autoriteit.</p>
      <h2 style={S.h2}>11. Wijzigingen van dit Beleid</h2>
      <p style={S.p}>Wij kunnen dit Privacybeleid op elk moment wijzigen. Wijzigingen worden geplaatst op deze pagina en je wordt op de hoogte gesteld van substantiële wijzigingen.</p>
    </>
  ),

  cookies: (
    <>
      <p style={S.updated}>Versiedatum: 27 september 2026 | Versie 2.1 | Taal: Nederlands</p>
      <p style={S.p}>Garden For Life gebruikt geen HTTP-cookies. Het platform werkt uitsluitend met <strong style={S.strong}>localStorage</strong> en <strong style={S.strong}>sessionStorage</strong> — browseropslag die alleen op uw eigen apparaat staat en nooit automatisch naar onze servers wordt verstuurd. Er is geen cookiebanner op deze website omdat hiervoor wettelijk geen toestemming vereist is. Dit beleid geldt voor de website én voor de desktopapplicatie (zie 2.4).</p>
      <h2 style={S.h2}>1. Geen Cookies — Wel Lokale Browseropslag</h2>
      <p style={S.p}>Een traditionele cookie is een klein bestandje dat een website op uw apparaat plaatst en bij elk bezoek automatisch terugstuurt naar de server. Garden For Life gebruikt geen HTTP-cookies van welke aard dan ook.</p>
      <p style={S.p}>In plaats daarvan maakt Garden For Life gebruik van <strong style={S.strong}>localStorage</strong> en <strong style={S.strong}>sessionStorage</strong> — twee opslagmechanismen die standaard in uw browser ingebouwd zijn. Het essentiële verschil:</p>
      <ul style={S.ul}>
        <li style={S.li}>Lokale opslag blijft op uw apparaat. Het wordt nooit naar onze servers verzonden.</li>
        <li style={S.li}>De data is alleen leesbaar door de Garden For Life website zelf — niet door derden.</li>
        <li style={S.li}>U heeft volledige controle: u kunt de opslag op elk moment wissen via uw browserinstellingen.</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Juridische basis:</strong> Hoewel localStorage geen cookie is in de traditionele zin, valt opslag van persoonsgegevens op een apparaat onder de Telecommunicatiewet art. 11.7a en de ePrivacy-richtlijn. Voor strikt noodzakelijke opslag is geen toestemming vereist. Garden For Life gebruikt lokale opslag uitsluitend voor de werking van het platform.</p>
      <h2 style={S.h2}>2. Wat Slaan Wij Op in Uw Browser?</h2>
      <h3 style={S.h3}>2.1 Strikt Noodzakelijke Opslag (localStorage)</h3>
      <p style={S.p}>De volgende items worden opgeslagen om het platform te laten werken. Zonder deze opslag kan het platform niet functioneren.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_token</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>JWT authenticatietoken — identificeert uw ingelogde sessie. Bevat geen wachtwoord; wel een gebruikers-ID en uw e-mailadres. In de desktopapplicatie met „Onthoudt mijn wachtwoord” aangevinkt blijft u ingelogd tot 30 dagen na uw laatste geslaagde aanmelding; zonder dat vinkje eindigt de sessie zodra u de applicatie sluit.</td></tr>
          <tr><td style={S.td}>gfl_session_ts</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>Tijdstip van uw laatste aanmelding — een sessie zonder kristal-code verloopt na 24 uur; in de desktopapplicatie met „Onthoudt mijn wachtwoord” aangevinkt na 30 dagen.</td></tr>
          <tr><td style={S.td}>gfl_orb_code</td><td style={S.td}>Tot uitloggen of het wisselen van code</td><td style={S.td}>Uw kristal-code, nadat u daarmee inlogt of een nieuwe code koppelt. Dit is een inloggegeven: behandel het apparaat als vertrouwd.</td></tr>
          <tr><td style={S.td}>gfl_orb_config</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>De vorm van uw orb (alleen om te tekenen), zodat uw account direct zichtbaar is.</td></tr>
          <tr><td style={S.td}>gfl_client_profile</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>Weergavenaam, archetype-naam en — als u die opgaf — land en leeftijd, voor het verbindingsmenu.</td></tr>
          <tr><td style={S.td}>gfl_boot_lesson</td><td style={S.td}>Tot uitloggen</td><td style={S.td}>De levensles van uw archetype, voor het startscherm na het inloggen.</td></tr>
          <tr><td style={S.td}>gfl_language_choice</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Uw taalkeuze (Nederlands of Engels).</td></tr>
          <tr><td style={S.td}>gfl_tool_tickets</td><td style={S.td}>Tot gebruik; hooguit tot het einde van de volgende maand</td><td style={S.td}>Alleen in de desktopapplicatie: anonieme, eenmalig bruikbare toegangsbewijzen voor hulpmiddelen (zie het Privacybeleid, artikel 6). Zij bevatten geen account- of persoonsgegevens.</td></tr>
          <tr><td style={S.td}>gfl_remember_login</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Alleen in de desktopapplicatie: uw keuze bij „Onthoudt mijn wachtwoord” (aan of uit). Uw wachtwoord zelf wordt nooit opgeslagen — alleen de inlogsessie (gfl_token).</td></tr>
        </tbody>
      </table>
      <p style={S.p}><strong style={S.strong}>Let op:</strong> de lokale opslag bevat hooguit onderdelen van uw <em>gedeeltelijke profiel</em> (archetype-naam, orb-vorm, levensles) om uw account snel te tonen. Uw assessmentantwoorden, uw volledige profiel en uw rapport worden niet in localStorage of sessionStorage opgeslagen; zij bestaan uitsluitend in het werkgeheugen van het geopende tabblad en verdwijnen wanneer u de pagina verlaat. Restanten van de sleutels die eerdere versies van het platform hiervoor gebruikten (gfl_assessment_session, gfl_assessment_history, gfl_pending_assessment, gfl_assessment_id en gfl_analysis_sections) worden automatisch gewist. De sleutel gfl_pdf_replay komt uitsluitend in ontwikkelversies voor en nooit op het live platform.</p>

      <h3 style={S.h3}>2.2 Beheerdersopslag (localStorage)</h3>
      <p style={S.p}>De volgende items worden uitsluitend opgeslagen wanneer u het platform als beheerder gebruikt. Voor gewone gebruikers worden ze nooit aangemaakt.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_invoice_number</td><td style={S.td}>Lokaal permanent</td><td style={S.td}>Factuurnummerteller — lokaal opgeslagen.</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>2.3 SessionStorage</h3>
      <p style={S.p}>SessionStorage werkt identiek aan localStorage maar wordt automatisch gewist zodra u het browservenster of tabblad sluit.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Sleutel</th><th style={S.th}>Bewaartermijn</th><th style={S.th}>Doel</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>chunk_reload</td><td style={S.td}>Browservenster of tabblad sluit</td><td style={S.td}>Eenmalige herlaadbeveiliging bij een verouderde deployversie — voorkomt oneindige herlaadbewegingen na een platformupdate.</td></tr>
          <tr><td style={S.td}>gfl_workspace_reminder_seen</td><td style={S.td}>Browservenster of tabblad sluit</td><td style={S.td}>Onthoudt dat de herinnering over uw werkmap in deze sessie al is getoond.</td></tr>
          <tr><td style={S.td}>gfl_login_alive</td><td style={S.td}>Applicatie sluit</td><td style={S.td}>Alleen in de desktopapplicatie: markeert dat u tijdens deze start van de applicatie bent ingelogd, zodat een inlogsessie zonder „Onthoudt mijn wachtwoord” bij de volgende start wordt beëindigd.</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>2.4 In de Desktopapplicatie</h3>
      <p style={S.p}>De desktopapplicatie gebruikt dezelfde lokale opslag als hierboven, onder haar eigen adres (app://gardenforlife) en alleen op uw apparaat. Daarnaast bewaart de applicatie in haar eigen gegevensmap op uw apparaat:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>config.json</strong> — uitsluitend de locatie van de werkmap die u koos. De inhoud van die map blijft in de map zelf.</li>
        <li style={S.li}><strong style={S.strong}>Update-cache</strong> — een gedownloade nieuwe versie van de applicatie, tot die is geïnstalleerd.</li>
      </ul>
      <h2 style={S.h2}>3. Wat Wij Niet Gebruiken</h2>
      <p style={S.p}>Garden For Life gebruikt geen van het volgende:</p>
      <ul style={S.ul}>
        <li style={S.li}>HTTP-cookies van welke aard dan ook</li>
        <li style={S.li}>Google Analytics, Google Tag Manager of andere Google-trackers</li>
        <li style={S.li}>Facebook Pixel of andere sociale media tracking</li>
        <li style={S.li}>Sentry of andere externe foutregistratiediensten</li>
        <li style={S.li}>Advertentienetwerken of retargeting</li>
        <li style={S.li}>Third-party embeds die opslag plaatsen</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Toekomstige analytics:</strong> Garden For Life overweegt mogelijk de toevoeging van Plausible Analytics — een cookieloze, privacy-vriendelijke analyticsdienst die geen persoonsgegevens verwerkt en geen opslag op uw apparaat plaatst. Bij implementatie wordt dit beleid bijgewerkt. Plausible vereist geen toestemming.</p>
      <h2 style={S.h2}>4. Lokale Opslag Wissen</h2>
      <p style={S.p}>U kunt de lokale opslag van Garden For Life op elk moment wissen via uw browserinstellingen. Let op: dit verwijdert uw inlogstatus en, in de desktopapplicatie, uw nog niet gebruikte toegangsbewijzen voor hulpmiddelen. Uw werkmap staat niet in de browseropslag en blijft staan. Garden For Life kan gewiste lokale gegevens niet herstellen.</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Chrome:</strong> Instellingen → Privacy en beveiliging → Browsegegevens verwijderen → Cookies en andere sitegegevens</li>
        <li style={S.li}><strong style={S.strong}>Firefox:</strong> Instellingen → Privacy & Beveiliging → Cookies en sitegegevens → Gegevens verwijderen</li>
        <li style={S.li}><strong style={S.strong}>Safari:</strong> Voorkeuren → Privacy → Beheer websitegegevens → gardenforlife.nl → Verwijder</li>
        <li style={S.li}><strong style={S.strong}>Edge:</strong> Instellingen → Privacy, zoeken en services → Browsegegevens wissen</li>
      </ul>
      <p style={S.p}>U kunt ook specifiek de Garden For Life opslag wissen via de Developer Tools van uw browser (F12 → Application → Local Storage → gardenforlife.nl).</p>
      <h2 style={S.h2}>5. Wijzigingen in Dit Beleid</h2>
      <ol style={S.ol}>
        <li style={S.li}>Garden For Life behoudt zich het recht voor dit beleid te wijzigen bij uitbreiding van de platformfunctionaliteit.</li>
        <li style={S.li}>Bij toevoeging van diensten die tracking of niet-noodzakelijke opslag vereisen, wordt een passend toestemmingsmechanisme geïmplementeerd vóór de wijziging van kracht wordt.</li>
        <li style={S.li}>De versiedatum bovenaan dit document geeft aan wanneer het beleid voor het laatst is gewijzigd.</li>
      </ol>
      <h2 style={S.h2}>6. Contact</h2>
      <p style={S.p}>Voor vragen over dit beleid:</p>
      <p style={S.p}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community<br/><strong style={S.strong}>Adres:</strong> De Taxushaag 2, Zutphen, 7207MB</p>
      <p style={S.p}>Dit beleid maakt onderdeel uit van het bredere privacybeleid van Garden For Life, te raadplegen via <PolicyLink to="/privacybeleid">Privacybeleid</PolicyLink>.</p>
      <p style={{...S.p, textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '1rem'}}>Garden For Life — Cookiebeleid & Lokale Opslag | Versie 2.1 | 27 september 2026</p>
    </>
  ),

  ai: (
    <>
      <p style={S.updated}>Versiedatum: 27 september 2026 | Versie 2.1</p>
      <h2 style={S.h2}>1. EU AI Act Compliance</h2>
      <p style={S.p}>Garden for Life streeft naar volledige transparantie over het gebruik van kunstmatige intelligentie in het platform, in lijn met de Europese AI-verordening (AI Act).</p>
      <h2 style={S.h2}>2. Wat Is AI in Garden for Life?</h2>
      <p style={S.p}>Garden for Life gebruikt twee afzonderlijke onderdelen. Je archetypes, scores en de geometrie van je profiel worden berekend door het <strong style={S.strong}>Deltawerken-rekenmodel</strong>: een vaste berekening op je antwoorden, zonder AI. Het <strong style={S.strong}>rapport</strong> — de tekst die die uitkomsten uitlegt — wordt geschreven door een taalmodel: Claude, van Anthropic.</p>
      <div style={S.box}>
        <h3 style={S.h3}>⚠️ KRITIEK DISCLAIMER</h3>
        <p style={S.p}><strong style={S.strong}>Dit rapport is GEEN klinische diagnose.</strong> Garden for Life is geen vervanger voor professionele psychologische, psychiatrische of medische begeleiding. Raadpleeg altijd een gekwalificeerde professional voor gezondheidsgerelateerde vragen.</p>
      </div>
      <h2 style={S.h2}>3. Welke AI-Technologieën Gebruiken We?</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Taalmodel (Claude, Anthropic):</strong> schrijft het rapport en de korte kaartteksten, op basis van de berekende uitkomsten en de instructies van Garden For Life. Het wordt via de API van Anthropic aangeroepen; Garden For Life traint of wijzigt het model niet.</li>
        <li style={S.li}><strong style={S.strong}>Deltawerken-rekenmodel (geen AI):</strong> berekent de scores per archetype, de mandjesverdeling, de geometrie, je Main- en Support-archetype en je schaduw en blinde vlek. Dezelfde antwoorden geven altijd dezelfde uitkomst.</li>
        <li style={S.li}><strong style={S.strong}>Automatische verwijdering van persoonsgegevens (geen AI):</strong> vaste regels die namen en contactgegevens uit een geüpload persoonlijkheidsrapport halen voordat het model de tekst ziet.</li>
      </ul>
      <p style={S.p}>Garden For Life gebruikt geen eigen getrainde neurale netwerken, geen gezichts- of stemanalyse en geen analyse van je gedrag op het platform.</p>
      <h2 style={S.h2}>4. Welke Data Wordt aan het AI-Systeem Verstrekt?</h2>
      <p style={S.p}>Het AI-systeem ontvangt de volledige assessmentdata — geanonimiseerd (geen naam/e-mail/IP), maar inclusief ruwe antwoorden. Deze data wordt uitsluitend voor het genereren van uw analyse verstuurd: de server van Garden For Life verwerkt haar in het werkgeheugen en slaat haar niet op. Het enige exemplaar van uw volledige profiel staat in uw eigen browsertabblad, zolang uw sessie duurt.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>Toelichting</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>responses</td><td style={S.td}>De ruwe antwoordenreeks — uw individuele keuzes per vraag (A–F) voor alle 36 vragen (72 picks)</td></tr>
          <tr><td style={S.td}>subjectResults</td><td style={S.td}>Geaggregeerde scores per van de 5 thema's (Zelf, Ander, Massa, Wereld, Mysterie)</td></tr>
          <tr><td style={S.td}>scores</td><td style={S.td}>Het berekende scoreprofiel per archetype</td></tr>
          <tr><td style={S.td}>archetypeDetails</td><td style={S.td}>Uitgewerkte archetypenanalyse inclusief 5-mandje decompositie per archetype (Nature Core, Green Hardware, Culture Core, Blue Feedback, Yellow Cognitief, Purple Schaduw)</td></tr>
          <tr><td style={S.td}>OCEAN-scores (indien aangeleverd)</td><td style={S.td}>Zelfingevulde persoonlijkheidsscores — optioneel</td></tr>
          <tr><td style={S.td}>uploadedFileContents (indien bestand geüpload)</td><td style={S.td}>De geëxtraheerde tekst uit geüploade bestanden, zoals een OCEAN-rapport in PDF-formaat. De gebruiker bepaalt zelf welke bestanden worden geüpload en is verantwoordelijk voor de inhoud daarvan.</td></tr>
          <tr><td style={S.td}>Systeeminstructies</td><td style={S.td}>De Garden For Life rapportinstructies — bevatten geen persoonsgegevens</td></tr>
        </tbody>
      </table>
      <p style={S.p}>Wat het AI-systeem standaard <strong style={S.strong}>NIET</strong> ontvangt vanuit het platform: uw naam, e-mailadres, IP-adres, accountgegevens, locatiedata of browsergegevens.</p>
      <div style={S.warn}>
        <p style={{ ...S.p, margin: 0 }}><strong style={{ color: '#fb923c' }}>Geüploade bestanden:</strong> indien u een persoonlijkheidsrapport uploadt (PDF, DOCX of TXT; afbeeldingen worden niet geaccepteerd), gaat de tekst daarvan naar Claude — nadat onze server er namen, e-mailadressen, telefoonnummers, postcodes en geboortedata uit heeft verwijderd en het bestand een neutrale naam heeft gegeven. Deze automatische verwijdering vangt de gangbare vormen af; wat zij niet herkent, bereikt de servers van Anthropic (VS) wel. Garden For Life is niet verantwoordelijk voor welke persoonsgegevens of andere informatie de gebruiker opneemt in geüploade bestanden.</p>
      </div>
      <p style={S.p}><strong style={S.strong}>Hulpmiddelen in de desktopapplicatie:</strong> gebruikt een hulpmiddel een AI-model, dan gaat het verzoek anoniem — zonder inloggegevens, cookies of gegevens die naar jou, je account, je apparaat of je werkmap verwijzen. Invoer en uitkomst worden niet bewaard (zie het Privacybeleid, artikel 6).</p>
      <h2 style={S.h2}>5. Hoe Werkt het?</h2>
      <h3 style={S.h3}>Stap 1: Berekening</h3>
      <p style={S.p}>Het Deltawerken-rekenmodel zet je antwoorden om in scores per archetype en een geometrie. Dit is een vaste berekening, geen AI.</p>
      <h3 style={S.h3}>Stap 2: Het rapport schrijven</h3>
      <p style={S.p}>De berekende uitkomsten gaan, samen met de rapportinstructies van Garden For Life, naar Claude. Claude rekent niets opnieuw uit: het schrijft de tekst die de uitkomsten uitlegt.</p>
      <h3 style={S.h3}>Stap 3: Je profiel</h3>
      <p style={S.p}>De berekening plaatst je in een duaal-kernmodel met:</p>
      <ul style={S.ul}>
        <li style={S.li}>Primair archetype (dominante persoonlijkheidsstijl)</li>
        <li style={S.li}>Secundair archetype (ondersteunende stijl)</li>
        <li style={S.li}>Schaduwprofiel (verdroogde of onderontwikkelde aspecten)</li>
        <li style={S.li}>Blinde vlekken (onbewuste blinde plekken)</li>
      </ul>
      <h2 style={S.h2}>6. Trainingsgegevens & Bias</h2>
      <p style={S.p}>Garden For Life traint geen eigen AI-model en gebruikt je antwoorden, rapport of uploads niet om modellen te trainen. Claude is door Anthropic getraind; volgens de commerciële voorwaarden van Anthropic worden gegevens die via de API worden verstuurd niet gebruikt om de modellen van Anthropic te trainen. Het Deltawerken-model is een zelfreflectiemodel dat is opgebouwd uit archetypische patronen; het is niet op persoonsgegevens getraind.</p>
      <p style={S.p}>Een taalmodel kan vooroordelen uit zijn eigen training meenemen in hoe het formuleert. Wij letten daarop in onze instructies en werken eraan om:</p>
      <ul style={S.ul}>
        <li style={S.li}>Vooroordeel uit te sluiten op grond van geslacht, leeftijd, ethnische afkomst</li>
        <li style={S.li}>Culturele verschillen in communicatiestijlen te respecteren</li>
        <li style={S.li}>Niet-westerse perspectieven te integreren</li>
      </ul>
      <h2 style={S.h2}>7. Nauwkeurigheid & Validatie</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Vaste berekening:</strong> Dezelfde antwoorden geven dezelfde archetypes, scores en geometrie</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Tekst kan verschillen:</strong> Omdat een taalmodel formuleert, kan de tekst van het rapport per keer licht verschillen; de uitkomsten waarop het rapport rust niet</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Niet klinisch of wetenschappelijk gevalideerd:</strong> Dit model is gericht op zelfexploratie, niet diagnostiek</li>
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
        <li style={S.li}>Je antwoorden en je volledige profiel worden niet opgeslagen — niet op onze server en niet in de lokale opslag van je browser; ze bestaan alleen in je eigen tabblad tijdens je sessie</li>
        <li style={S.li}>Het AI-model verwerkt jouw antwoorden individueel — zonder naam, e-mailadres of andere directe identificatoren vanuit het platform</li>
        <li style={S.li}>Geen real-time persoonlijk monitoring</li>
        <li style={S.li}>Zolang je rapport open staat, stuurt het platform geen verzoeken met je accountgegevens, zodat het rapport niet via het tijdstip aan je account te koppelen is</li>
        <li style={S.li}>Een rapport dat niet is betaald of vrijgegeven wordt volledig verwijderd zodra je de rapportpagina verlaat; een vrijgegeven rapport bestaat alleen nog als jouw gedownloade PDF</li>
        <li style={S.li}>Geen overdracht naar trainingsdata voor toekomstige modellen</li>
      </ul>
      <h2 style={S.h2}>10. Verbeteringen</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔄 <strong style={S.strong}>Feedback:</strong> Via het reviewformulier kun je laten weten hoe goed je rapport past; die feedback (90 dagen bewaard) gebruiken wij om de rapportinstructies te verbeteren</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Geen retraining:</strong> Wij hertrainen geen model; verbeteringen zitten in het rekenmodel en de instructies</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Transparante updates:</strong> Een wissel van AI-aanbieder of een wezenlijke wijziging wordt op deze pagina gemeld vóórdat die in gebruik gaat</li>
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
        <li style={S.li}>✅ <strong style={S.strong}>Inzage:</strong> Welke gegevens naar het model gaan staat in artikel 4</li>
        <li style={S.li}>✅ <strong style={S.strong}>Bezwaar:</strong> Tegen automatische profilering — je kunt de test altijd laten voor wat hij is</li>
        <li style={S.li}>✅ <strong style={S.strong}>Verwijdering:</strong> Zie het Privacybeleid en de pagina Gegevensbehoud &amp; Verwijdering</li>
        <li style={S.li}>✅ <strong style={S.strong}>Menselijke blik:</strong> Vragen over je rapport kun je aan ons stellen; een medewerker van Garden For Life kijkt mee. Dit is geen psychologische of klinische beoordeling</li>
      </ul>
      <h2 style={S.h2}>14. Klachten & Escalatie</h2>
      <ol style={S.ol}>
        <li style={S.li}>E-mail: yuanwullink30@gfl.community</li>
        <li style={S.li}>Wij reageren zo snel mogelijk, uiterlijk binnen 30 dagen</li>
        <li style={S.li}>Dien klacht in bij je nationale AI-toezichthoudende autoriteit</li>
      </ol>
      <h2 style={S.h2}>15. Toekomstige AI-Verbeteringen</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔮 Multilinguale ondersteuning</li>
        <li style={S.li}>🔮 Cross-culturele validatie</li>
        <li style={S.li}>🔮 Anonieme hulpmiddelen in de desktopapplicatie</li>
        <li style={S.li}>🔮 Verbeterde explainability (waarom deze profile?)</li>
      </ul>
      <h2 style={S.h2}>16. Contact</h2>
      <p style={S.p}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community<br/><strong style={S.strong}>Onderwerp:</strong> "AI-transparantie vraag" of "AI-bezwaar"<br/><strong style={S.strong}>Verwachte respons:</strong> zo snel mogelijk, uiterlijk binnen 30 dagen</p>
    </>
  ),

  ip: (
    <>
      <p style={S.updated}>Versiedatum: 16 maart 2026 | Versie 2.0</p>
      <p style={S.p}>Alle originele werken, systemen en visuele creaties op het Garden For Life platform zijn beschermd onder de Nederlandse Auteurswet (Aw) en de Europese Richtlijn 2001/29/EG. Garden For Life is de exclusieve rechthebbende op alle hieronder beschreven intellectuele eigendomsrechten.</p>

      <h2 style={S.h2}>1. Rechthebbende</h2>
      <p style={S.p}>De intellectuele eigendomsrechten op alle originele werken, systemen, methodieken, visuele creaties en overige beschermde content op dit platform berusten uitsluitend bij:</p>
      <div style={S.box}>
        <p style={S.p}><strong style={S.strong}>Garden For Life</strong><br/>De Taxushaag 2, Zutphen, 7207MB<br/>KVK-nummer: 85125245<br/>E-mail: yuanwullink30@gfl.community</p>
        <p style={{...S.p, marginBottom: 0}}>Hierna te noemen: 'Garden For Life', 'wij' of 'ons'.</p>
      </div>

      <h2 style={S.h2}>2. Beschermde Werken — Visuele Conceptuele Modellen</h2>
      <p style={S.p}>De volgende visuele en conceptuele modellen zijn originele werken van Garden For Life, vervaardigd in Adobe Photoshop. Garden For Life beschikt over de originele bewerkbare bronbestanden (.PSD) als primair bewijs van makerschap.</p>

      <h3 style={S.h3}>2.1 Cells within Cells Interlinked</h3>
      <p style={S.p}>Het model 'Cells within Cells Interlinked' is een origineel visueel-conceptueel werk dat een hiërarchisch, fractaalgebaseerd psychologisch geometriesysteem beschrijft opgebouwd uit vijf concentrische lagen van betekenis.</p>
      <p style={S.p}><strong style={S.strong}>Wat dit model beschrijft</strong><br/>Het werk bestaat uit een hoofddriehoek met daarin geneste knooppuntcirkels en ingebedde driehoekige subelementen. De visuele architectuur verdeelt de menselijke ervaring in vijf opeenvolgende lagen:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>One Manna (wit):</strong> De overkoepelende eenheid van het systeem — de buitenste structuur die alle lagen omvat</li>
        <li style={S.li}><strong style={S.strong}>Two Forces (rood):</strong> De primaire polaire spanning binnen het systeem — de twee fundamentele drijvende krachten</li>
        <li style={S.li}><strong style={S.strong}>Four Elements (roze/geel):</strong> De vier elementaire knooppunten (Geest/Lucht, Vuur, Geest/Water, Lichaam/Aarde) als ingebedde driehoekige subelementen binnen de hoofdgeometrie</li>
        <li style={S.li}><strong style={S.strong}>Five Fundamentals (cyaan):</strong> De vijf fundamentele verbindingsassen (Intimiteit/Gemeenschap, Zelfrespect/Karakter, Zelfactualisatie/Transformatie, Doel/Passie/Visie, Fysiologische standaarden)</li>
        <li style={S.li}><strong style={S.strong}>Seven Modern Arts (groen):</strong> De zeven kennisdomeinen (Biologie, Alchemie/Astronomie, Scheikunde, Fysica/Geometrie, Technologie en aanverwante disciplines) als horizontale grondlaag</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Knooppunten & Positionering</strong><br/>De zeven primaire knooppunten zijn specifiek gepositioneerd binnen de triangulaire geometrie:</p>
      <ul style={S.ul}>
        <li style={S.li}>Soulmate — top apex</li>
        <li style={S.li}>Femininity & Masculinity — middelste horizontale as</li>
        <li style={S.li}>Chaos/Intuition & Order/Rationality — zijknooppunten</li>
        <li style={S.li}>Soul/Ego — geometrisch centrum</li>
        <li style={S.li}>Natural, Empathy/History, Humanities/Encouragement & Social — basisrij</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life claimt</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>De specifieke vijflaagse hiërarchische opbouw en de naamgeving van elke laag als systeem</li>
        <li style={S.li}>De specifieke positionering en benamingen van alle zeven knooppunten binnen de triangulaire geometrie</li>
        <li style={S.li}>De kleurcodering per laag als drager van conceptuele betekenis</li>
        <li style={S.li}>De combinatie van geneste driehoekige subelementen (elementaire symbolen) binnen de hoofdknooppunten</li>
        <li style={S.li}>Het visuele geheel als samengesteld origineel werk</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life niet claimt:</strong> De driehoek als geometrische basisvorm, de vier klassieke elementen (Lucht, Vuur, Water, Aarde) als concept, en het begrip 'fractaalstructuur' zijn generieke concepten in het publieke domein. Garden For Life claimt uitsluitend de specifieke originele uitwerking, combinatie en visuele geometrie van dit model.</p>

      <h3 style={S.h3}>2.2 Het Deltawerken Model (FM/MF Polariteitsgeometrie)</h3>
      <p style={S.p}>Het Deltawerken Model is een origineel visueel-conceptueel werk dat een psychologische polariteitsgeometrie beschrijft op basis van de spanning en integratie tussen feminiene (F) en masculiene (M) krachten, uitgewerkt in een driehoekige fractaalstructuur.</p>
      <p style={S.p}><strong style={S.strong}>Wat dit model beschrijft</strong><br/>Het model bestaat uit een hoofddriehoek met drie geneste subdriehoeken. De vier apices van het systeem zijn:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Top (FM — Liefde/Dood):</strong> De spanning tussen liefde en dood als hoogste integratiepunt van feminiene en masculiene krachten</li>
        <li style={S.li}><strong style={S.strong}>Linksonder (FM — Natuur):</strong> De feminiene gronding in de natuurlijke wereld</li>
        <li style={S.li}><strong style={S.strong}>Rechtsonder (MF — Maatschappij):</strong> De masculiene uitdrukking in de maatschappelijke structuur</li>
        <li style={S.li}><strong style={S.strong}>Ondercentrum (MF — Leven):</strong> Het levende middelpunt als integratiepunt van beide krachten</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>De drie subdriehoeken & hun inhoud</strong></p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Bovenste subdriehoek (Schoonheid/Nederigheid/Ideaal):</strong> De aspiratielaag — focus, patroon, perceptie en flow als randconcepten</li>
        <li style={S.li}><strong style={S.strong}>Linker subdriehoek (Waarheid/Integriteit/Loslaten):</strong> De grondings- en integriteitslaag — inspiratie en emotioneel als randconcepten</li>
        <li style={S.li}><strong style={S.strong}>Rechter subdriehoek (Goedheid/Integratie/Toelaten):</strong> De acceptatie- en integratielaag — rationeel en compassie als randconcepten</li>
        <li style={S.li}><strong style={S.strong}>Centraal vlak (Supersymmetrie/Beheersing/Passie):</strong> Het integratiepunt van alle drie de subdriehoeken</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>De drie fundamentele vragen als navigatiestructuur</strong><br/>Een uniek kenmerk van dit model is de ingebedde drieledige vraagstructuur als gebruiksprotocol:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>1. Met wie</strong> — de relationele oriëntatievraag</li>
        <li style={S.li}><strong style={S.strong}>2. Wat</strong> — de inhoudelijke oriëntatievraag</li>
        <li style={S.li}><strong style={S.strong}>3. Waarom</strong> — de motivationele oriëntatievraag</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life claimt</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>De specifieke FM/MF-polariteitsnotatie en de betekenis daarvan als psychologisch navigatiesysteem</li>
        <li style={S.li}>De specifieke positionering van de vier apices en de drie subdriehoeken met hun respectievelijke inhoud</li>
        <li style={S.li}>De drieledige vraagstructuur (met wie/wat/waarom) als ingebedde navigatiemethodiek</li>
        <li style={S.li}>De koppeling van schaduwwerk en onderbewustzijn aan de geometrische structuur als conceptueel systeem</li>
        <li style={S.li}>Het visuele geheel inclusief kleurcodering (oranje FM, rood MF, groen masculien, geel feminien, paars de structuur) als origineel werk</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life niet claimt:</strong> Het begrippenpaar feminien/masculien, de driehoek als basisvorm, en de afzonderlijke concepten (waarheid, liefde, natuur) zijn generieke termen in het publieke domein. Garden For Life claimt de specifieke geometrische combinatie, de polariteitslogica en de visuele uitwerking als origineel samengesteld werk.</p>

      <h3 style={S.h3}>2.3 Het 12-Archetype Verbindingswiel (Triple Network World Morphology)</h3>
      <p style={S.p}>Het 12-Archetype Verbindingswiel is het visuele en conceptuele hart van het Garden For Life Deltawerken Model. Het is een origineel werk dat een gesloten circulair systeem van 12 archetypische posities beschrijft, verbonden via vijf categorieën van psychologische relatielijnen.</p>
      <p style={S.p}><strong style={S.strong}>Over de circulaire 12-positiestructuur</strong><br/>De indeling in 12 circulaire posities is een generieke geometrische structuur die in diverse culturele en wetenschappelijke tradities voorkomt. Garden For Life claimt deze basisstructuur niet. Garden For Life claimt uitsluitend de volgende specifieke en originele uitwerking:</p>
      <p style={S.p}><strong style={S.strong}>De vijf relatielijnensystemen — kern van de claim</strong><br/>Het meest originele element van dit model is het vijfvoudige, kleurgecodeerde verbindingssysteem dat de psychologische relaties tussen alle 12 posities definieert:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Gele lijnen — Cognitieve Synergie</strong> (Zelfde getrainde software-mechanisme): Vier driehoekige verbindingspatronen die cognitieve synergiemodi definiëren: Idealisme, Exploratie, Impact en Engagement. Elke driehoek verbindt drie specifieke archetypen die via aangeleerde gedragspatronen samenwerken.</li>
        <li style={S.li}><strong style={S.strong}>Blauwe lijnen — Feedback Brug</strong> (Feedback-circuits die door de gedeelde hardware reizen): Zes horizontale dwarsverbindingen die gedeelde feedback-circuits definiëren tussen tegenoverliggende maar complementaire archetypen. Blauwe bleed distribueert per-pick punten naar de Blauwe Lijn-partner (posities die samen 13 zijn) in het scoremodel.</li>
        <li style={S.li}><strong style={S.strong}>Groene bogen — Hardware Anker</strong> (Gebruik van zelfde biologische netwerk): Zes gebogen verbindingen langs de buitenrand die de zes biologische supportgroepen markeren — paren van archetypen die binnen hetzelfde neurologische netwerkpatroon opereren.</li>
        <li style={S.li}><strong style={S.strong}>Paarse lijnen — Schaduw Archetypen</strong> (Uiterst psychologische vloek en gift): Zes 180°-diametrische verbindingen die de schaduw-tegenpool van elk Main Archetype definiëren. Paarse drip distribueert passief +1 punt per Nature-1e-pick naar de 180° schaduw-partner.</li>
        <li style={S.li}><strong style={S.strong}>Rode lijnen — Neurale Kortsluiting</strong> (Biologische hardware botst): Zes verticale spanningsassen die de Blindspot-tegenpool van elk Main Archetype definiëren — de externe saboteur in het systeem.</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>De 12 archetypische posities en hun specifieke plaatsing</strong><br/>De specifieke toewijzing van de 12 archetypen aan de circulaire posities en hun onderverdeling in 6 biologische supportgroepen is een originele creatie van Garden For Life:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Groep 1 — Ruling (CEN-dominant):</strong> Judge (positie 1) & Ruler (positie 12)</li>
        <li style={S.li}><strong style={S.strong}>Groep 2 — Relational (Limbisch):</strong> Lover (positie 2) & Caregiver (positie 3)</li>
        <li style={S.li}><strong style={S.strong}>Groep 3 — Seeker (Hoge Openness):</strong> Innocent (positie 4) & Explorer (positie 5)</li>
        <li style={S.li}><strong style={S.strong}>Groep 4 — Chaos (Salience Network):</strong> Outlaw (positie 6) & Trickster (positie 7)</li>
        <li style={S.li}><strong style={S.strong}>Groep 5 — Abstract (DMN):</strong> Sage (positie 8) & Artist (positie 9)</li>
        <li style={S.li}><strong style={S.strong}>Groep 6 — Agency (Wilskracht):</strong> Magician (positie 10) & Hero (positie 11)</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life claimt</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>Het vijfvoudige kleurgecodeerde relatielijnensysteem als geheel — de combinatie van vijf specifieke relatiecategorieën met elk hun eigen psychologische betekenis en scorewaarde</li>
        <li style={S.li}>De specifieke scorelogica die aan elke lijn is gekoppeld (Per-Pick Geometric Bleed: +9/+6 Nature Core, +3/+1 Green Hardware, +7/+4 Culture Core, +2/+1 Blue Feedback, +2/+1 Yellow Cognitief, +1 Purple Schaduw)</li>
        <li style={S.li}>De specifieke toewijzing van de 12 archetypen aan hun posities en de indeling in 6 supportgroepen</li>
        <li style={S.li}>De shadow/blindspot-logica als ingebouwd psychologisch navigatiesysteem</li>
        <li style={S.li}>De 5-mandje accumulatiestructuur (72 picks × geometrische distributie ≈ 720 punten) en de stacked radar chart architectuur</li>
        <li style={S.li}>Het visuele geheel inclusief de specifieke kleurkeuzen, de diktes van de verbindingslijnen en de opmaak van de legenda</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life niet claimt:</strong> De 12-positie circulaire structuur als zodanig, de individuele archetypennamen gebaseerd op Jungiaanse theorie (Judge, Lover, Hero etc.), en de associatie van archetypen met neurologische netwerken als concept zijn niet exclusief eigendom van Garden For Life. De specifieke uitwerking, de vijfvoudige relatielogica en het scoremodel zijn dat wel.</p>

      <h3 style={S.h3}>2.4 De 132 Extended Archetypes Matrix</h3>
      <p style={S.p}>De 132 Extended Archetypes Matrix is een origineel werk van Garden For Life dat voortvloeit uit de combinatielogica van het 12-Archetype Verbindingswiel.</p>
      <p style={S.p}><strong style={S.strong}>Wat deze matrix beschrijft</strong><br/>De matrix definieert 132 unieke psychologische profielen door elk van de 12 Main Archetypen te combineren met elk van de 11 mogelijke Support Archetypen. Dit resulteert in een 12×11 combinatiematrix waarbij elke cel een specifieke Extended Archetype-titel en karakterisering bevat.</p>
      <p style={S.p}><strong style={S.strong}>Wat Garden For Life claimt</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>De combinatielogica die leidt tot precies 132 Extended Archetype-profielen als systeem</li>
        <li style={S.li}>De specifieke Extended Archetype-titels als originele samengestelde namen, waaronder onder meer: The Networker, The Therapist, The Usurper, The Forgemaster, The Alchemist, The Sovereign, The Whistleblower, The Gatecrasher, The Mentor, The Storyteller, The Oracle, The Astronaut, The Reformer, The Spellbinder, The Pioneer, The Sailor</li>
        <li style={S.li}>De Harmonic Match-aanduiding per combinatie en de bijbehorende synergiebeschrijving</li>
        <li style={S.li}>De karakterisering van elk Extended Archetype — de beschrijving van hoe de combinatie van Main en Support een uniek psychologisch profiel creëert</li>
        <li style={S.li}>De schaduw- en blindspot-koppeling per Extended Archetype als ingebouwd psychologisch navigatiesysteem</li>
      </ul>
      <div style={S.box}>
        <p style={{...S.p, marginBottom: 0}}><strong style={S.strong}>Compilatiedoctrine:</strong> Onder de Nederlandse Auteurswet vormt de 132-matrix als geheel een beschermd verzamelwerk (compilatie). Zelfs indien individuele archetypennamen generiek zouden zijn, is de specifieke selectie, ordening en karakterisering van alle 132 combinaties een origineel werk van Garden For Life.</p>
      </div>

      <h3 style={S.h3}>2.5 De Visuele Archetypemodellen (12 individuele werken)</h3>
      <p style={S.p}>De 12 individuele visuele representaties van de kern-archetypen zijn volledig met de hand vervaardigd in Adobe Photoshop. Garden For Life beschikt over de originele bewerkbare bronbestanden (.PSD) inclusief de volledige bewerkingsgeschiedenis als bewijs van makerschap.</p>
      <div style={S.box}>
        <p style={{...S.p, marginBottom: 0}}><strong style={S.strong}>Bewijs van makerschap:</strong> De .PSD-bronbestanden bevatten de volledige lagenstructuur, bewerkingsgeschiedenis en versies. Dit vormt het primaire bewijs van oorspronkelijk makerschap conform artikel 1 Auteurswet.</p>
      </div>

      <h3 style={S.h3}>2.6 De Stacked Radar Chart & Dual-Core Dynamics Visualisatie</h3>
      <p style={S.p}>De specifieke visuele weergave van de assessmentresultaten — de 12-as stacked radar chart met 5 gestapelde kleurlagen (Groen: Biologische Kern, Oranje: Aangeleerde Strategie, Blauw: Hardware Feedback, Goud: Cognitieve Lens, Paars: Schaduw Echo) en de Dual-Core Dynamics balkvisualisatie — zijn originele ontwerpwerken van Garden For Life.</p>

      <h3 style={S.h3}>2.7 De Assessmentvragen & Rotatiemethodiek</h3>
      <p style={S.p}>De 36 assessmentvragen (72 picks), de indeling in 5 thema's (Zelf/Zonde, Ander/Attentie, Massa/Macht, Wereld/Wijsheid, Mysterie/Magie), de antwoordopties, de 6-sleutel rotatiemethodiek en de Standard/Mirror Nature/Culture-routering per vraag vormen een origineel meetinstrument van Garden For Life.</p>

      <h3 style={S.h3}>2.8 De Rapportstructuur, Teksten & AI-Instructielaag</h3>
      <p style={S.p}>De structuur van het gegenereerde rapport — inclusief de vaste secties, de narratieve opbouw, de specifieke terminologie ('De Alchemie van Individuatie', 'Het Neurale Schakelbord', 'Ontologische Evolutie') en de AI-prompts die de rapportgeneratie aansturen — zijn originele werken van Garden For Life.</p>

      <h3 style={S.h3}>2.9 Visuele Huisstijl & Branding</h3>
      <p style={S.p}>De visuele identiteit van Garden For Life, waaronder het logo, het kleurenpalet, typografie, grafische elementen en de algehele platformvormgeving, zijn beschermd als originele werken en/of merken.</p>

      <h2 style={S.h2}>3. Wat Is Toegestaan</h2>
      <p style={S.p}>Zonder voorafgaande schriftelijke toestemming van Garden For Life is uitsluitend het volgende toegestaan:</p>
      <ol style={S.ol}>
        <li style={S.li}>Het bekijken en downloaden van het eigen persoonlijke rapport voor persoonlijk, niet-commercieel gebruik.</li>
        <li style={S.li}>Het delen van de archetype-naam (bijv. 'The Networker') op sociale media in de context van persoonlijke zelfpresentatie, mits Garden For Life wordt vermeld als bron.</li>
        <li style={S.li}>Het citeren van korte tekstfragmenten uit het eigen rapport voor persoonlijke reflectie of gespreksdoeleinden, mits de bron wordt vermeld.</li>
      </ol>

      <h2 style={S.h2}>4. Wat Niet Is Toegestaan</h2>
      <p style={S.p}>Zonder uitdrukkelijke schriftelijke toestemming van Garden For Life is het volgende niet toegestaan:</p>
      <ol style={S.ol} start="4">
        <li style={S.li}>Het reproduceren, kopiëren, distribueren of openbaar maken van de visuele modellen (Cells within Cells Interlinked, het Deltawerken Model, het 12-Archetype Verbindingswiel) of andere beschermde werken, in welke vorm dan ook.</li>
        <li style={S.li}>Het gebruiken van de visuele modellen, de 132 Extended Archetypes Matrix, het relatielijnensysteem of de scorelogica voor commerciële doeleinden, trainingen, publicaties of andere producten en diensten.</li>
        <li style={S.li}>Het inbedden, hergebruiken of afleiden van de assessmentvragen, rotatiemethodiek, scoringslogica of rapportstructuur in eigen producten of diensten.</li>
        <li style={S.li}>Het nabootsen of imiteren van de Garden For Life visuele stijl, archetypebeelden of systematiek op een wijze die verwarring kan wekken over de herkomst.</li>
        <li style={S.li}>Het verwijderen of onzichtbaar maken van copyright-vermeldingen of bronvermeldingen.</li>
        <li style={S.li}>Het geautomatiseerd uitlezen (scrapen) van platformcontent, rapporten, modellen of assessmentdata.</li>
      </ol>

      <h2 style={S.h2}>5. AI-Gegenereerde Rapporten — Eigendomspositie</h2>
      <p style={S.p}>De door het Garden For Life systeem gegenereerde rapporten zijn het resultaat van de combinatie van:</p>
      <ul style={S.ul}>
        <li style={S.li}>De originele assessmentinput van de Gebruiker (antwoorddata)</li>
        <li style={S.li}>De door Garden For Life ontwikkelde AI-prompts, systematiek en rapportstructuur</li>
        <li style={S.li}>De verwerking door AI-modellen — Garden For Life maakt gebruik van Claude, van Anthropic</li>
      </ul>
      <p style={S.p}>Garden For Life behoudt het auteursrecht op de rapportstructuur, de gebruikte terminologie, de AI-instructielaag en de systeemlogica. De inhoud van het gegenereerde rapport — als samengesteld werk voortkomend uit bovenstaande elementen — is eigendom van Garden For Life, met een persoonlijk gebruiksrecht voor de Gebruiker zoals beschreven in Artikel 3.</p>
      <div style={S.box}>
        <p style={{...S.p, marginBottom: 0}}><strong style={S.strong}>Opmerking auteursrecht AI-output:</strong> Naar huidig Nederlands en Europees recht komt auteursrecht niet toe aan AI-systemen. Garden For Life claimt auteursrecht op de rapportstructuur, de AI-instructielaag en de onderliggende systeemelementen — niet op de volledig door AI vrij gegenereerde tekstinhoud als zodanig. Dit is een juridisch evoluerend gebied. Garden For Life volgt de ontwikkelingen actief.</p>
      </div>

      <h2 style={S.h2}>6. Bewijs van Makerschap & Documentatie</h2>
      <p style={S.p}>Garden For Life beschikt over de volgende documentatie ter onderbouwing van het originele makerschap:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Cells within Cells Interlinked:</strong> Originele bewerkbare bronbestanden (.PSD) met volledige bewerkingsgeschiedenis, lagen en versies.</li>
        <li style={S.li}><strong style={S.strong}>Het Deltawerken Model:</strong> Originele bewerkbare bronbestanden (.PSD) met volledige bewerkingsgeschiedenis, lagen en versies.</li>
        <li style={S.li}><strong style={S.strong}>Het 12-Archetype Verbindingswiel:</strong> Originele bewerkbare bronbestanden (.PSD) met volledige bewerkingsgeschiedenis, lagen en versies.</li>
        <li style={S.li}><strong style={S.strong}>De 132 Extended Archetypes Matrix:</strong> Gedateerde ontwikkeldocumentatie en de volledige combinatietabel met karakteriseringen.</li>
        <li style={S.li}><strong style={S.strong}>Assessmentvragen & rotatiemethodiek:</strong> Gedateerde vraagontwikkeling en iteratiehistorie.</li>
        <li style={S.li}><strong style={S.strong}>Rapportstructuur & AI-instructielaag:</strong> Versiegeschiedenis van alle AI-instructiedocumenten.</li>
        <li style={S.li}><strong style={S.strong}>12 individuele archetypebeelden:</strong> .PSD-bronbestanden per archetype.</li>
      </ul>
      <p style={S.p}>Deze documentatie is beschikbaar voor overlegging aan bevoegde autoriteiten of in het kader van juridische procedures.</p>

      <h2 style={S.h2}>7. Licenties & Toestemming</h2>
      <ol style={S.ol} start="10">
        <li style={S.li}>Voor commercieel hergebruik, licentieverlening of samenwerking waarbij gebruik wordt gemaakt van Garden For Life intellectueel eigendom, kunt u contact opnemen via <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</li>
        <li style={S.li}>Garden For Life beoordeelt licentieverzoeken per geval. Het verlenen van een licentie geschiedt uitsluitend schriftelijk en onder door Garden For Life te bepalen voorwaarden.</li>
        <li style={S.li}>Toestemming voor gebruik in educatieve, wetenschappelijke of journalistieke context kan worden aangevraagd via hetzelfde adres.</li>
      </ol>

      <h2 style={S.h2}>8. Handhaving</h2>
      <ol style={S.ol} start="13">
        <li style={S.li}>Garden For Life behoudt zich het recht voor om bij inbreuk op haar intellectuele eigendomsrechten alle beschikbare juridische middelen in te zetten, waaronder het vorderen van schadevergoeding, winstafdracht en het laten verwijderen van inbreukmakende content.</li>
        <li style={S.li}>Bij geconstateerde inbreuk wordt de inbreukmaker schriftelijk gesommeerd de inbreuk onmiddellijk te staken. Bij niet-naleving kan Garden For Life overgaan tot gerechtelijke stappen.</li>
        <li style={S.li}>Inbreuken kunnen worden gemeld via <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</li>
      </ol>

      <h2 style={S.h2}>9. Toepasselijk Recht</h2>
      <p style={S.p}>Op deze intellectuele eigendomsverklaring en alle geschillen die daaruit voortvloeien is Nederlands recht van toepassing. De bevoegde rechter is de rechtbank van het arrondissement Zutphen.</p>
      <p style={S.p}><strong style={S.strong}>Relevante wetgeving:</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>Auteurswet 1912 (Nederland)</li>
        <li style={S.li}>Richtlijn 2001/29/EG (Auteursrecht in de informatiemaatschappij)</li>
        <li style={S.li}>Benelux-verdrag inzake de intellectuele eigendom (BVIE) — voor merkrechten</li>
        <li style={S.li}>Richtlijn 2019/790/EU (DSM Auteursrechtrichtlijn)</li>
      </ul>

      <h2 style={S.h2}>10. Contact</h2>
      <p style={S.p}>Voor vragen, meldingen of licentieverzoeken met betrekking tot intellectueel eigendom:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community</li>
        <li style={S.li}><strong style={S.strong}>Adres:</strong> De Taxushaag 2, Zutphen, 7207MB</li>
        <li style={S.li}><strong style={S.strong}>KVK-nummer:</strong> 85125245</li>
      </ul>
      <p style={{...S.p, marginTop: '2rem', borderTop: '1px solid rgba(255,174,0,0.15)', paddingTop: '1rem', opacity: 0.5, fontSize: 'max(9px, 0.4vw)'}}>
        Garden For Life — Intellectueel Eigendom | Versie 2.0 | 16 maart 2026
      </p>
    </>
  ),

  usage: (
    <>
      <p style={S.updated}>Versiedatum: 16 maart 2026 | Versie 2.1</p>
      <p style={S.p}>Garden For Life staat open gebruik en verspreiding van persoonlijke inzichten niet in de weg. Deze pagina richt zich uitsluitend op drie specifieke vormen van misbruik die schade kunnen toebrengen aan gebruikers, aan derden, of aan de integriteit van de Garden For Life modellen en het platform: commerciële exploitatie zonder toestemming, manipulatief misbruik van resultaten, en ongeautoriseerde AI-training.</p>

      <h2 style={S.h2}>1. Waar Wij Niet Tegen Optreden</h2>
      <p style={S.p}>Garden For Life beoogt geen beperking van het vrije gebruik van persoonlijke inzichten. Het volgende is uitdrukkelijk toegestaan zonder toestemming:</p>
      <ul style={S.ul}>
        <li style={S.li}>Het delen van je eigen archetyperesultaten op sociale media of in persoonlijke gesprekken</li>
        <li style={S.li}>Het bespreken van de Garden For Life modellen in educatieve, journalistieke of wetenschappelijke context, mits Garden For Life als bron wordt vermeld</li>
        <li style={S.li}>Het verwijzen naar Garden For Life in persoonlijke of professionele reflectie</li>
        <li style={S.li}>Het gebruik van je eigen rapport als persoonlijk ontwikkelingsinstrument in welke context dan ook</li>
      </ul>

      <h2 style={S.h2}>2. Commerciële Exploitatie Zonder Toestemming</h2>
      <h3 style={S.h3}>Wat hieronder valt</h3>
      <p style={S.p}>Het is niet toegestaan de Garden For Life modellen — waaronder het Deltawerken Model, het 12-Archetype Verbindingswiel, Cells within Cells Interlinked, de 132 Extended Archetypes Matrix, de bijbehorende scorelogica of de rapportmethodiek — in geheel of in herkenbare delen te gebruiken als basis voor:</p>
      <ul style={S.ul}>
        <li style={S.li}>Betaalde coaching- of consultancydiensten waarbij één of meer van de Garden For Life modellen als methodiek worden gepresenteerd</li>
        <li style={S.li}>Cursussen, trainingen, workshops of opleidingen die de Garden For Life systematiek als inhoudelijke kern hanteren</li>
        <li style={S.li}>Boeken, e-books, online cursussen of andere commerciële publicaties gebaseerd op de Garden For Life modellen of methodiek</li>
        <li style={S.li}>Assessmenttools, apps of platforms die de scorelogica, relatielijnensystemen, de geometrie of de archetypensystematiek repliceren of afleiden</li>
        <li style={S.li}>Licentieverlening of doorverkoop van Garden For Life content aan derden</li>
      </ul>

      <h3 style={S.h3}>Wat wij verstaan onder 'herkenbare delen'</h3>
      <p style={S.p}>Herkenbaar gebruik omvat onder meer:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Deltawerken Model:</strong> de FM/MF-polariteitsgeometrie, de vier-apex driehoeksstructuur met subdriehoeken, de inhoudelijke benaming van apices en vlakken, de drieledige vraagstructuur (met wie/wat/waarom)</li>
        <li style={S.li}><strong style={S.strong}>12-Archetype Verbindingswiel:</strong> het vijfvoudige kleurgecodeerde relatielijnensysteem (Geel/Blauw/Groen/Paars/Rood) met bijbehorende psychologische betekenis, de specifieke toewijzing van archetypen aan posities, de Per-Pick Geometric Bleed scorelogica gekoppeld aan de lijnen (5-mandje distributie per pick)</li>
        <li style={S.li}><strong style={S.strong}>Cells within Cells Interlinked:</strong> de vijflaagse hiërarchische opbouw (One Manna t/m Seven Modern Arts), de specifieke knooppuntposities en benamingen, de kleurcodering per laag</li>
        <li style={S.li}><strong style={S.strong}>132 Extended Archetypes:</strong> de combinatielogica, de specifieke Extended Archetype-titels, de schaduw- en blindspot-koppelingen</li>
        <li style={S.li}><strong style={S.strong}>Rapportstructuur:</strong> de specifieke terminologie en sectieopbouw van het Garden For Life rapport</li>
      </ul>

      <h3 style={S.h3}>Waarom dit beleid bestaat</h3>
      <p style={S.p}>Dit beleid beschermt niet alleen Garden For Life als organisatie, maar ook gebruikers. Wanneer de modellen buiten de oorspronkelijke context worden toegepast door niet-geautoriseerde partijen, kan de kwaliteit, nuance en ethische inkadering van de methodiek niet worden gegarandeerd — met potentiële schade aan de gebruiker tot gevolg.</p>
      <div style={S.box}>
        <h3 style={S.h3}>📋 Licentie aanvragen</h3>
        <p style={S.p}>Partijen die de Garden For Life modellen willen inzetten in een professionele of commerciële context kunnen een licentieverzoek indienen via <strong style={S.strong}>yuanwullink30@gfl.community</strong>. Garden For Life staat open voor samenwerkingen waarbij de integriteit van het systeem gewaarborgd blijft.</p>
      </div>

      <h2 style={S.h2}>3. Manipulatief Misbruik van Resultaten</h2>
      <h3 style={S.h3}>Wat hieronder valt</h3>
      <p style={S.p}>Het Garden For Life rapport is een zelfreflectie-instrument. Misbruik ontstaat wanneer resultaten worden ingezet om een persoon te beïnvloeden, te beoordelen of te benadelen op een wijze die buiten de persoonlijke zelfontwikkelingscontext valt. Het volgende is uitdrukkelijk verboden:</p>
      <div style={S.warn}>
        <p style={S.p}><strong style={S.strong}>Misbruik van rapporten:</strong> Het gebruiken van andermans Garden For Life rapport of archetyperesultaten zonder diens uitdrukkelijke toestemming om hen te profileren, beoordelen, uitsluiten of manipuleren is verboden en kan in strijd zijn met de AVG en het Nederlandse strafrecht.</p>
      </div>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Profilering zonder toestemming:</strong> Het gebruiken van iemands archetyperesultaten, schaduwprofiel of blindspot om beslissingen over die persoon te nemen op het gebied van werk, relaties, groepstoegang of andere levensgebieden, zonder hun uitdrukkelijke instemming.</li>
        <li style={S.li}><strong style={S.strong}>Psychologische manipulatie:</strong> Het inzetten van kennis over iemands archetype, FM/MF-profiel, schaduw of blindspot om die persoon bewust te manipuleren, te destabiliseren of te beïnvloeden in hun gedrag of besluitvorming.</li>
        <li style={S.li}><strong style={S.strong}>Misleidende framing:</strong> Het presenteren van Garden For Life resultaten als klinische diagnoses, wetenschappelijk bewezen persoonlijkheidsmetingen of anderszins autoritatieve oordelen over de psychologische gesteldheid van een persoon.</li>
        <li style={S.li}><strong style={S.strong}>Groepsmanipulatie:</strong> Het gebruiken van archetyperesultaten of FM/MF-profielen van meerdere personen om groepsdynamieken te sturen, personen tegen elkaar uit te spelen of sociale hiërarchieën te versterken.</li>
        <li style={S.li}><strong style={S.strong}>Commerciële misleiding:</strong> Het presenteren van Garden For Life resultaten als onderdeel van een dienst of product zonder te vermelden dat het een zelfreflectie-instrument betreft dat geen klinische basis heeft.</li>
      </ul>

      <h3 style={S.h3}>Juridische context</h3>
      <p style={S.p}>Afhankelijk van de aard en ernst van het misbruik kan dit in strijd zijn met:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>AVG Art. 9</strong> — Verbod op verwerking van psychologische profieldata zonder rechtsgrond</li>
        <li style={S.li}><strong style={S.strong}>AVG Art. 22</strong> — Verbod op automatische profilering met significante gevolgen zonder toestemming</li>
        <li style={S.li}><strong style={S.strong}>Wetboek van Strafrecht Art. 285</strong> — Bedreiging of dwang via psychologische middelen</li>
        <li style={S.li}><strong style={S.strong}>Boek 6 BW</strong> — Onrechtmatige daad bij aantoonbare schade als gevolg van misbruik</li>
      </ul>
      <p style={S.p}>Garden For Life zal bij goed gedocumenteerde meldingen van misbruik actief meewerken aan rapportage aan bevoegde autoriteiten, waaronder de AP en indien van toepassing het Openbaar Ministerie.</p>

      <h2 style={S.h2}>4. AI-Training & Geautomatiseerde Verwerking</h2>
      <h3 style={S.h3}>Wat hieronder valt</h3>
      <p style={S.p}>De Garden For Life content — waaronder de drie visuele conceptuele modellen (Cells within Cells Interlinked, het Deltawerken Model en het 12-Archetype Verbindingswiel), de 132 Extended Archetypes Matrix, de scorelogica, de rapportstructuur, de AI-instructielaag en de gegenereerde rapporten — mag niet worden gebruikt voor:</p>
      <ul style={S.ul}>
        <li style={S.li}>Het trainen, fine-tunen of evalueren van machine learning- of AI-modellen, large language models (LLMs) of andere geautomatiseerde systemen</li>
        <li style={S.li}>Het opnemen in datasets, benchmarks, evaluatiesets of pre-trainingscorpora</li>
        <li style={S.li}>Geautomatiseerd scrapen, indexeren of extractie ten behoeve van AI-systemen</li>
        <li style={S.li}>Het repliceren van de Garden For Life systematiek, relatielijnensystemen of polariteitsgeometrie via prompt engineering of in-context learning in commerciële AI-toepassingen</li>
      </ul>

      <h3 style={S.h3}>Waarom dit beleid bestaat</h3>
      <p style={S.p}>De drie visuele conceptuele modellen van Garden For Life zijn originele werken met een unieke geometrische en psychologische logica die nergens anders bestaat. AI-training op deze content zonder toestemming zou een directe economische schade toebrengen aan Garden For Life en de integriteit en uniciteit van het systeem aantasten. Bovendien bestaat het risico dat een AI getraind op deze content de modellen buiten de ethische en contextuele kaders toepast waarvoor zij zijn ontworpen.</p>
      <div style={S.box}>
        <h3 style={S.h3}>🤖 Robots.txt & technische maatregelen</h3>
        <p style={S.p}>Garden For Life hanteert technische en contractuele maatregelen om geautomatiseerde extractie te voorkomen. Het omzeilen van deze maatregelen is in strijd met deze voorwaarden en mogelijk met de Wet Computercriminaliteit III en de EU AI Act.</p>
      </div>

      <h3 style={S.h3}>Opmerking over eigen AI-gebruik</h3>
      <p style={S.p}>Garden For Life maakt gebruik van het Claude AI-model (Anthropic) voor de rapportgeneratie. Dit gebruik valt onder de verwerkersovereenkomst met Anthropic en is gedekt door de gebruikerstoestemming. Dit beleid richt zich uitsluitend op ongeautoriseerd gebruik door derden.</p>

      <h3 style={S.h3}>Onderzoeksuitzondering</h3>
      <p style={S.p}>Academisch of wetenschappelijk onderzoek naar de Garden For Life modellen is toegestaan mits: (a) Garden For Life vooraf schriftelijk is geïnformeerd via <strong style={S.strong}>yuanwullink30@gfl.community</strong>, (b) de onderzoeksresultaten niet commercieel worden geëxploiteerd zonder toestemming, en (c) de modellen correct en in context worden beschreven.</p>

      <h2 style={S.h2}>5. Melden van Misbruik</h2>
      <p style={S.p}>Heeft u kennis van misbruik van de Garden For Life modellen, de visuele werken of de rapportmethodiek? Meld dit via:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community</li>
        <li style={S.li}><strong style={S.strong}>Onderwerp:</strong> Misbruikmelding Garden For Life</li>
      </ul>
      <p style={S.p}>Vermeld bij uw melding zo concreet mogelijk: de aard van het misbruik, de betrokken partij (indien bekend), en eventueel beschikbaar bewijsmateriaal. Garden For Life behandelt meldingen vertrouwelijk en bevestigt ontvangst binnen 5 werkdagen.</p>

      <h2 style={S.h2}>6. Handhaving</h2>
      <ol style={S.ol}>
        <li style={S.li}>Garden For Life behoudt zich het recht voor bij geconstateerd misbruik zonder voorafgaande waarschuwing over te gaan tot juridische stappen, waaronder het vorderen van schadevergoeding, het laten verwijderen van inbreukmakende content en aangifte bij bevoegde autoriteiten.</li>
        <li style={S.li}>Bij commercieel misbruik hanteert Garden For Life een schadevergoedingsmodel gebaseerd op gederfde licentieopbrengsten en reputatieschade.</li>
        <li style={S.li}>Bij manipulatief misbruik waarbij aantoonbare schade is toegebracht aan een derde partij, zal Garden For Life actief meewerken aan civiel- en/of strafrechtelijke procedures.</li>
        <li style={S.li}>Bij geconstateerde AI-training op Garden For Life content zonder toestemming behoudt Garden For Life zich het recht voor verwijdering van de betreffende content uit trainingsdatasets te eisen conform de EU AI Act en het toepasselijk auteursrecht.</li>
      </ol>

      <h2 style={S.h2}>7. Toepasselijk Recht & Contact</h2>
      <p style={S.p}>Op dit beleid is Nederlands recht van toepassing. Bevoegde rechter: Rechtbank Zutphen.</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>E-mail:</strong> yuanwullink30@gfl.community</li>
        <li style={S.li}><strong style={S.strong}>Adres:</strong> De Taxushaag 2, Zutphen, 7207MB</li>
        <li style={S.li}><strong style={S.strong}>KVK-nummer:</strong> 85125245</li>
      </ul>
      <p style={{...S.p, marginTop: '2rem', borderTop: '1px solid rgba(255,174,0,0.15)', paddingTop: '1rem', opacity: 0.5, fontSize: 'max(9px, 0.4vw)'}}>
        Garden For Life — Gebruiksvoorwaarden & Misbruikbeleid | Versie 2.1 | 16 maart 2026
      </p>
    </>
  ),

  retention: <RetentionForm language="nl" />,

  register: (
    <>
      <p style={S.updated}>Versiedatum: 27 september 2026 | Versie 3.1</p>

      <h2 style={S.h2}>1. Verwerkingsverantwoordelijke</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Informatie</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Organisatienaam</td><td style={S.td}>Garden For Life</td></tr>
          <tr><td style={S.td}>Platform</td><td style={S.td}>Garden For Life Assessment Platform (website en desktopapplicatie)</td></tr>
          <tr><td style={S.td}>Verwerkingsverantwoordelijke</td><td style={S.td}>Yuan Wullink / Garden For Life</td></tr>
          <tr><td style={S.td}>Vestigingsland</td><td style={S.td}>Nederland</td></tr>
          <tr><td style={S.td}>Vestigingsadres</td><td style={S.td}>De Taxushaag 2, Zutphen, 7207MB</td></tr>
          <tr><td style={S.td}>KVK-nummer</td><td style={S.td}>85125245</td></tr>
          <tr><td style={S.td}>Contactpersoon Privacy</td><td style={S.td}>yuanwullink30@gfl.community</td></tr>
          <tr><td style={S.td}>Datum opgesteld</td><td style={S.td}>16 maart 2026</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>2. Verwerking 1 — Assessment &amp; Rapportgeneratie</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Garden For Life Advanced Personality Assessment</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>Het genereren van een persoonlijk zelfreflectierapport op basis van de assessmentantwoorden van de gebruiker.</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 6 AVG)</td><td style={S.td}>Toestemming — Art. 6 lid 1 sub a AVG</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 9 AVG)</td><td style={S.td}>Uitdrukkelijke toestemming — Art. 9 lid 2 sub a AVG (bijzondere categorie: psychologische profieldata)</td></tr>
          <tr><td style={S.td}>Categorieën betrokkenen</td><td style={S.td}>Gebruikers van het platform</td></tr>
          <tr><td style={S.td}>Categorieën persoonsgegevens</td><td style={S.td}>E-mailadres — accountidentificator<br/>Ruwe assessmentantwoorden (responses) — individuele keuzes per vraag — Art. 9<br/>Subjectresultaten per thema (subjectResults) — geaggregeerde scores per thema — Art. 9<br/>Archetype-scores (scores) — scoreprofiel per archetype — Art. 9<br/>Archetypedetails (archetypeDetails) — 5-mandje decompositie per archetype — Art. 9<br/>OCEAN-scores (indien aangeleverd) — Art. 9<br/>Tekst van een geüpload persoonlijkheidsrapport (indien aangeleverd; PDF, DOCX of TXT) — na automatische verwijdering van namen, e-mailadressen, telefoonnummers, postcodes en geboortedata, onder een neutrale bestandsnaam — Art. 9<br/>Volledig gegenereerd rapport — inclusief Extended Archetype, schaduw/blindspot, AI Agent Prompt — Art. 9<br/><em>Noot: bovenstaande gegevens vormen samen het volledige profiel. Dit bestaat in één enkel exemplaar, uitsluitend in het werkgeheugen van het browsertabblad van de gebruiker tijdens de sessie — ongeacht of de gebruiker is ingelogd.</em></td></tr>
          <tr><td style={S.td}>Bijzondere categorieën (Art. 9)</td><td style={S.td}><strong style={S.strong}>JA</strong> — Psychologische karakteristieken en gedragsprofielen. Valt onder de definitie van bijzondere persoonsgegevens conform de UAVG en AP-richtlijnen.</td></tr>
          <tr><td style={S.td}>Bewaartermijn</td><td style={S.td}><strong style={S.strong}>Niet opgeslagen.</strong> Voor het genereren van de analyse wordt het volledige profiel naar de server van Garden For Life en naar Claude (Anthropic) verzonden; de server verwerkt het uitsluitend in het werkgeheugen en legt het niet vast — geen databaserecord, geen verwerkingscache, geen bewaartermijn. Ook niet in de lokale browseropslag (localStorage/sessionStorage). Garden For Life, de beheerder daaronder begrepen, heeft achteraf geen toegang tot antwoorden, volledige profielen of rapporten en kan een rapport niet opnieuw genereren.<br/><br/><strong style={S.strong}>Vrijgegeven rapport</strong> (betaald via Stripe of met een activatiecode): pas dan verschijnt de kristal-code in het volledige rapport. De gedownloade PDF is het enige exemplaar, bestemd voor de lokale werkomgeving van de gebruiker. De code blijft levenslang geldig en kan éénmaal worden ingewisseld voor een account; Garden For Life legt uitsluitend een onomkeerbare SHA-256-hash vast. De kaarttekst bij een vrijgegeven maar nog niet ingewisselde code blijft, uitsluitend gekoppeld aan die hash, zonder bewaartermijn bewaard en wordt bij inwisseling in het account opgenomen (zie Verwerking 2).<br/><br/><strong style={S.strong}>Niet-vrijgegeven rapport:</strong> zodra de gebruiker de rapportpagina verlaat (tabblad sluiten, herladen of wegnavigeren) wordt het rapport volledig verwijderd — het volledige profiel en de versleutelde kristal-code verdwijnen uit het tabblad en de server verwijdert de kaarttekst onder de hash van die code. Technisch vangnet, uitsluitend wanneer dat verwijderingssignaal niet aankomt (bijvoorbeeld bij verbindingsverlies): de versleutelde code verloopt na 24 uur en de nachtelijke opruiming om 00:00 (Europe/Amsterdam) verwijdert de kaarttekst. Een niet-vrijgegeven rapport kan nooit later worden opgevraagd; het volledige rapport kan uitsluitend éénmaal, direct na de test, worden aangeschaft.<br/><br/>Wat na inwisseling blijft is uitsluitend het gedeeltelijke profiel (zie Verwerking 2).</td></tr>
          <tr><td style={S.td}>Geautomatiseerde besluitvorming (Art. 22)</td><td style={S.td}>Het rapport wordt volledig gegenereerd door Claude (Anthropic). Er worden geen beslissingen over betrokkenen genomen op basis van uitsluitend geautomatiseerde verwerking. Het rapport dient als zelfreflectie-instrument; de interpretatie berust bij de gebruiker zelf.</td></tr>
          <tr><td style={S.td}>Ontvangers / doorgifte</td><td style={S.td}><strong style={S.strong}>Anthropic (Claude API)</strong> — verwerker, assessmentdata wordt doorgegeven voor rapportgeneratie. De doorgestuurde data omvat: de ruwe antwoordenreeks (responses), subjectresultaten per thema (subjectResults), archetype-scores (scores), archetypedetails (archetypeDetails), eventuele OCEAN-scores en de opgeschoonde tekst van een geüpload persoonlijkheidsrapport, en de Garden For Life systeeminstructies. Persoonlijke identificatoren (naam, e-mail, IP) worden niet doorgegeven; namen en contactgegevens in een upload worden vooraf automatisch verwijderd. DPA: automatisch van kracht via acceptatie Anthropic Commercial Terms of Service — maart 2026.<br/><br/><strong style={S.strong}>MongoDB Atlas</strong> — verwerker, opslag in Frankfurt (EU). Ontvangt uit deze verwerking géén antwoorden, volledig profiel of rapport; uitsluitend de kaarttekst die aan de hash van een kristal-code is gekoppeld (zonder naam, e-mailadres of accountverwijzing). Verwerkersovereenkomst: aanwezig via Atlas-platform DPA (online acceptatie).<br/><br/><strong style={S.strong}>Render.com</strong> — verwerker, hosting van de applicatieserver in de regio Frankfurt (EU). Alle verzoeken passeren deze host en worden daar in het werkgeheugen verwerkt; er wordt geen profieldata op de host bewaard. Verwerkersovereenkomst: aanwezig via Render DPA (online acceptatie).</td></tr>
          <tr><td style={S.td}>Doorgifte buiten EU/EER</td><td style={S.td}><strong style={S.strong}>Anthropic (VS)</strong> — doorgifte op basis van standaardcontractbepalingen (SCC). [Verificatie aanbevolen bij juridisch adviseur]<br/><strong style={S.strong}>MongoDB Atlas (Frankfurt, EU)</strong> — geen doorgifte buiten EU/EER.</td></tr>
          <tr><td style={S.td}>Beveiligingsmaatregelen</td><td style={S.td}>• Versleuteling in transit: TLS 1.2+<br/>• Versleuteling at rest: AES-256 (Atlas standaard)<br/>• Aanvullende veldversleuteling: e-mailadres en weergavenaam AES-256-GCM<br/>• Toegangsbeperking: database afgeschermd met inloggegevens en netwerkregels<br/>• Toestemmingsregistratie op applicatieniveau: het moment van toestemming wordt met tijdstempel vastgelegd<br/>• Toegangsbeheer: uitsluitend de verwerkingsverantwoordelijke heeft admin-toegang; ook via die toegang zijn geen antwoorden, volledige profielen of rapporten in te zien, omdat deze niet worden opgeslagen<br/>• Dataminimalisatie: het volledige profiel bestaat alleen in het browsertabblad van de gebruiker en wordt op de server uitsluitend in het werkgeheugen verwerkt<br/>• Serverlocatie: Frankfurt, Duitsland (EU)<br/>• JWT bearer-authenticatie — geen sessiecookies, daardoor geen CSRF-oppervlak<br/>• Ontkoppeling in de tijd: het analyseverzoek bevat geen token; zolang het rapport open staat verstuurt het platform geen verzoeken met accountgegevens, en daarna pas na een willekeurige vertraging van 1,5–4 minuten<br/>• Uploads: alleen PDF, DOCX of TXT; afbeeldingen worden geweigerd; persoonsgegevens worden verwijderd vóór het parsen; de oorspronkelijke bestandsnaam verlaat de browser niet<br/>• Serverlogs bevatten geen e-mailadressen</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>3. Verwerking 2 — Gebruikersaccount &amp; Gedeeltelijk Profiel</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Garden For Life Gebruikersaccount — Gedeeltelijk Profiel</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>Het account laten bestaan en tonen: de orb tekenen, het accountscherm vullen en — bij een openbaar profiel — de publieke kaart in de Verbonden-directory tonen.</td></tr>
          <tr><td style={S.td}>Rechtsgrond gedeeltelijk profiel</td><td style={S.td}>Toestemming — Art. 6 lid 1 sub a AVG (en Art. 9 lid 2 sub a AVG indien de samenvatting psychologische kenmerken bevat)</td></tr>
          <tr><td style={S.td}>Categorieën betrokkenen</td><td style={S.td}>Geregistreerde gebruikers van het Garden For Life platform</td></tr>
          <tr><td style={S.td}>Categorieën persoonsgegevens — Samenvatting</td><td style={S.td}>E-mailadres en weergavenaam (beide AES-256-GCM versleuteld)<br/>Optioneel: leeftijd en land<br/>De SHA-256 hash van elke ingewisselde kristal-code — nooit de code zelf<br/><strong style={S.strong}>Het gedeeltelijke profiel</strong>, per ingewisselde code: archetype-naam, de render-only orb-geometrie, de genormaliseerde 12-punts vormvector, een samenvatting van de mandjesverdeling per archetype (voor het wiel op de profielkaart) en de bijbehorende kaartteksten (levensles, gift, curse, geometriesamenvatting)<br/>Een systeembericht van Garden For Life (het welkomstbericht bij een nieuw account), versleuteld opgeslagen zoals andere berichten<br/><em>Noot: bevat géén ruwe assessment-antwoorden en géén volledige analyse. De vormvector en de mandjesverdeling zijn afgeleide psychologische kenmerken en vallen daarmee onder Art. 9 AVG; zij worden verwerkt op grond van dezelfde uitdrukkelijke toestemming.</em></td></tr>
          <tr><td style={S.td}>Volledig rapport</td><td style={S.td}>Het volledige rapport wordt niet door het platform bewaard. Het kan uitsluitend éénmaal, direct na de test, worden vrijgegeven (betaling of activatiecode) en gedownload; de PDF is het enige exemplaar. Een niet-vrijgegeven rapport wordt volledig verwijderd zodra de gebruiker de rapportpagina verlaat (zie Verwerking 1). Het korte rapport is gratis downloadbaar en bevat geen kristal-code.</td></tr>
          <tr><td style={S.td}>Bewaartermijn</td><td style={S.td}>Gedeeltelijk profiel: zolang het gebruikersaccount bestaat.<br/>Hash van de kristal-code: zolang het account bestaat — zonder deze hash zou dezelfde PDF een tweede account kunnen openen.<br/>Accountverwijdering: verwijdering binnen 30 dagen na verzoek.</td></tr>
          <tr><td style={S.td}>Geautomatiseerde besluitvorming</td><td style={S.td}>Niet van toepassing op het gedeeltelijke profiel. Het AI-model genereert het rapport eenmalig; de opgeslagen samenvatting is een statisch gegeven.</td></tr>
          <tr><td style={S.td}>Ontvangers</td><td style={S.td}>Geen derden ontvangen het gedeeltelijke profiel, tenzij de gebruiker het profiel zelf op openbaar zet (zie Verwerking 4). MongoDB Atlas (Frankfurt) — opslag als verwerker.</td></tr>
          <tr><td style={S.td}>Beveiligingsmaatregelen</td><td style={S.td}>Zie Verwerking 1 — zelfde technische maatregelen van toepassing.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>4. Verwerking 3 — Feedback / Assessmentreviews</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Feedback — assessmentreviews</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>Verzamelen van vrijwillige gebruikersfeedback op het gegenereerde assessmentrapport, ter verbetering van de rapportagekwaliteit en het assessmentsysteem.</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 6 AVG)</td><td style={S.td}>Toestemming — Art. 6 lid 1 sub a AVG (gebruiker verstuurt het formulier vrijwillig)</td></tr>
          <tr><td style={S.td}>Categorieën betrokkenen</td><td style={S.td}>Gebruikers die na afloop van het assessment vrijwillig feedback geven</td></tr>
          <tr><td style={S.td}>Categorieën persoonsgegevens</td><td style={S.td}>E-mailadres (platte tekst — niet versleuteld)<br/>Feedbackteksten: accuraatheid, niet-overeenkomende punten, suggesties, sterrenwaardering<br/>Tijdstempel<br/>User-agent (browseridentificatie)<br/><em>Niet opgeslagen: een account-id (reviews zijn niet aan een account gekoppeld) en het archetype — dat wordt alleen in het werkgeheugen gebruikt om de bevestigingsmail te formuleren en daarna weggegooid.</em></td></tr>
          <tr><td style={S.td}>Bijzondere categorieën (Art. 9)</td><td style={S.td}><strong style={S.strong}>Mogelijk</strong> — De feedbacktekst kan verwijzingen bevatten naar het psychologisch profiel. Verwerking is beschermd onder de uitdrukkelijke toestemming die de gebruiker heeft gegeven bij aanvang van het assessment (Art. 9 lid 2 sub a AVG).</td></tr>
          <tr><td style={S.td}>Bewaartermijn</td><td style={S.td}>TTL-index: 90 dagen na aanmaak automatisch verwijderd uit MongoDB Atlas.</td></tr>
          <tr><td style={S.td}>Ontvangers / doorgifte</td><td style={S.td}><strong style={S.strong}>MongoDB Atlas (Frankfurt, EU)</strong> — verwerker, opslag van feedbackrecords. Verwerkersovereenkomst: aanwezig via Atlas-platform DPA.<br/><strong style={S.strong}>Google Workspace</strong> — verwerker, verzending van de bevestigingsmail aan het opgegeven adres en een melding aan de beheerder (met het archetype, zonder het adres van de afzender).<br/>Geen doorgifte naar Anthropic of andere derden — feedbackdata wordt niet naar de AI gestuurd.</td></tr>
          <tr><td style={S.td}>Opslagformaat</td><td style={S.td}>E-mailadres wordt opgeslagen als <strong style={S.strong}>platte tekst</strong> (niet AES-256-GCM versleuteld zoals in de users-collectie). Dit betreft een bewuste afweging: de feedbackcollectie bevat geen psychologische profieldata zelf, en wordt binnen 90 dagen automatisch verwijderd.</td></tr>
          <tr><td style={S.td}>Verwijdering bij accountdeletie</td><td style={S.td}>Reviews zijn niet aan een account gekoppeld. Bij verwijdering van een gebruikersaccount worden reviews verwijderd die met het e-mailadres van dat account zijn verstuurd (hoofdletterongevoelige vergelijking); anders verlopen zij na 90 dagen.</td></tr>
          <tr><td style={S.td}>Beveiligingsmaatregelen</td><td style={S.td}>Zie Verwerking 1 — zelfde technische maatregelen. Aanvullend: de route accepteert geen accounttoken — reviews worden per ontwerp anoniem verstuurd. Logregels bevatten geen e-mailadres en geen archetype.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>5. Verwerking 4 — Openbaar Profiel, Verbonden &amp; Berichten</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Garden For Life sociale laag — openbaar profiel, verbonden en interne berichten</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>Gebruikers die dat wensen zichtbaar maken voor andere gebruikers, hen met elkaar in contact laten komen en onderling berichten laten uitwisselen.</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 6 AVG)</td><td style={S.td}>Toestemming — Art. 6 lid 1 sub a AVG. De zichtbaarheid staat standaard <strong style={S.strong}>uit</strong> en wordt uitsluitend actief wanneer de gebruiker het profiel zelf op openbaar zet.</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 9 AVG)</td><td style={S.td}>Uitdrukkelijke toestemming — Art. 9 lid 2 sub a AVG. Aanvullend geldt Art. 9 lid 2 sub e voor gegevens die de betrokkene zelf kennelijk openbaar heeft gemaakt.</td></tr>
          <tr><td style={S.td}>Categorieën persoonsgegevens</td><td style={S.td}>Openbaar zichtbaar: weergavenaam, archetype-naam, de render-only orb en de genormaliseerde vorm (uitsluitend vorm — geen ruwe scores)<br/>Niet openbaar: verbond-verzoeken tussen accounts (afzender, ontvanger, status, tijdstip) en interne berichten (titel en inhoud, AES-256-GCM versleuteld opgeslagen)</td></tr>
          <tr><td style={S.td}>Zichtbaarheid</td><td style={S.td}>Een profiel met zichtbaarheid uit levert dezelfde respons op als een niet-bestaand profiel, zodat niet kan worden afgeleid dat het account bestaat.</td></tr>
          <tr><td style={S.td}>Bewaartermijn</td><td style={S.td}>Zolang het account bestaat, of tot de gebruiker de zichtbaarheid uitzet respectievelijk het verbond verbreekt. Berichten blijven staan tot verwijdering van het account.</td></tr>
          <tr><td style={S.td}>Ontvangers / doorgifte</td><td style={S.td}>Andere gebruikers van het platform, uitsluitend voor zover de gebruiker dat zelf heeft ingesteld. Geen doorgifte naar Anthropic of andere derden — de sociale laag wordt niet naar de AI gestuurd.</td></tr>
          <tr><td style={S.td}>Beveiligingsmaatregelen</td><td style={S.td}>Zie Verwerking 1. Aanvullend: berichttitels en -teksten worden versleuteld opgeslagen; de openbare kaart bevat per ontwerp uitsluitend vormgegevens.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>6. Verwerking 5 — Lokale Werkomgeving</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Garden For Life lokale werkomgeving — opslag op het apparaat van de gebruiker</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>De gebruiker zijn rapporten, een kopie van zijn gedeeltelijke profiel en — zodra beschikbaar — zijn volledige profiel en de uitkomsten van hulpmiddelen op zijn eigen apparaat laten bewaren, via de desktopapplicatie, zodat deze gegevens niet bij Garden For Life hoeven te staan.</td></tr>
          <tr><td style={S.td}>Rol van Garden For Life</td><td style={S.td}><strong style={S.strong}>Geen.</strong> Gegevens in de lokale map staan uitsluitend op het apparaat van de gebruiker. Garden For Life heeft daar geen toegang toe, ontvangt daarvan geen kopie en is voor die gegevens geen verwerker of verwerkingsverantwoordelijke.</td></tr>
          <tr><td style={S.td}>Toestemming</td><td style={S.td}>Eenmalige toestemming voor één specifieke map: de werkmap die de applicatie in de gebruikersmap aanmaakt, of de locatie waarheen de gebruiker hem verplaatst. Elk hulpmiddel dat met die map werkt vraagt <strong style={S.strong}>afzonderlijk</strong> om toestemming, met vermelding vooraf van de gebruikte gegevens en van wat er naar Garden For Life wordt verzonden. Toestemmingen worden bijgehouden in een register in de map zelf. Een map is gekoppeld aan één account (in de map vastgelegd) en wordt voor een ander account geweigerd. De applicatie onthoudt op het apparaat uitsluitend de locatie van de map.</td></tr>
          <tr><td style={S.td}>Wat er wél naar Garden For Life gaat</td><td style={S.td}>Uitsluitend de invoer die een hulpmiddel nodig heeft om te rekenen, via een <strong style={S.strong}>anonieme gateway</strong>: het verzoek bevat geen accounttoken, geen cookies en geen identificatoren (account-, map- of apparaat-id, e-mailadres, naam) — de applicatie weigert zulke velden vóór verzending, en de gateway weigert verzoeken met een token of cookies. Toegang wordt aangetoond met een eenmalig bruikbaar toegangsbewijs dat blind is ondertekend (RFC 9474, RSABSSA-SHA384-PSS-Randomized). Het ophalen van toegangsbewijzen is de enige accountgebonden stap; dat gebeurt in batches op willekeurige rustige momenten, nooit direct vóór een verzoek. De verwerking krijgt uitsluitend de invoer (geen verzoekgegevens, headers, IP of gebruiker), logt en bewaart invoer en uitkomst niet. Nooit de ruwe antwoorden.</td></tr>
          <tr><td style={S.td}>Bewaartermijn bij Garden For Life</td><td style={S.td}>Invoer en uitkomst van hulpmiddelen: niet bewaard.<br/>Per account het <strong style={S.strong}>aantal</strong> uitgegeven toegangsbewijzen per maand (<code>toolTicketIssuance</code>, maximaal 300) — nooit de bewijzen zelf; automatisch verwijderd na afloop van de volgende maand (TTL-index).<br/>SHA-256-hash van elk gebruikt toegangsbewijs (<code>toolTicketsSpent</code>), zonder tijdstip of account — tegen hergebruik; automatisch verwijderd na afloop van de volgende maand (TTL-index).<br/>Maandelijkse ondertekeningssleutel (<code>toolTicketKeys</code>; privésleutel AES-256-GCM versleuteld).<br/>Het IP-adres is zichtbaar voor de hostingpartij maar wordt op deze route niet vastgelegd.</td></tr>
          <tr><td style={S.td}>Verwijdering van servergegevens</td><td style={S.td}>Via het verzoek tot verwijdering (zie artikel 7). Een losse functie om na het inrichten van de map de resterende servergegevens te verwijderen, bestaat nog niet.</td></tr>
          <tr><td style={S.td}>Risico voor de betrokkene</td><td style={S.td}>Omdat Garden For Life geen kopie bewaart, leidt verlies van de map tot onherstelbaar verlies van de inhoud. De gebruiker wordt hierop gewezen op het moment dat de toestemming wordt gevraagd.</td></tr>
          <tr><td style={S.td}>Distributie en updates van de applicatie</td><td style={S.td}>Installatiebestanden en updates worden uitgeleverd via Cloudflare R2 (downloads.gardenforlife.nl). De applicatie controleert bij het opstarten en elke vier uur op een nieuwe versie; daarbij ziet de host het IP-adres en de versie van de applicatie, geen accountgegevens.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>6a. Verwerking 6 — Betalingen, Terugbetalingen &amp; Grijze Lijst</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Veld</th><th style={S.th}>Details</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Naam verwerking</td><td style={S.td}>Vrijgave van het volledige rapport — betaling, activatiecode, 14-dagen geld-terug-garantie en grijze lijst</td></tr>
          <tr><td style={S.td}>Doel van verwerking</td><td style={S.td}>(1) De betaling voor het volledige rapport afhandelen en het rapport vrijgeven; (2) een terugbetaling onder de garantie uitvoeren en de bijbehorende kristal-code blokkeren; (3) misbruik van de garantie voorkomen; (4) voldoen aan de fiscale bewaarplicht.</td></tr>
          <tr><td style={S.td}>Rechtsgrond (Art. 6 AVG)</td><td style={S.td}>(1) en (2): uitvoering van de overeenkomst — Art. 6 lid 1 sub b<br/>(3) grijze lijst: gerechtvaardigd belang — Art. 6 lid 1 sub f (voorkomen van misbruik van een vrijwillige garantie; de gevolgen voor de betrokkene zijn beperkt tot enkele vragen bij een volgend verzoek)<br/>(4) wettelijke verplichting — Art. 6 lid 1 sub c, art. 52 AWR (7 jaar)</td></tr>
          <tr><td style={S.td}>Bijzondere categorieën (Art. 9)</td><td style={S.td}><strong style={S.strong}>NEE</strong> — de betaalregistratie en de grijze lijst bevatten geen profieldata. De kristal-code wordt uitsluitend als hash vastgelegd.</td></tr>
          <tr><td style={S.td}>Categorieën betrokkenen</td><td style={S.td}>Gebruikers die het volledige rapport betalen, met een activatiecode vrijgeven of een terugbetaling vragen</td></tr>
          <tr><td style={S.td}>Categorieën persoonsgegevens</td><td style={S.td}>Vrijgaveregistratie (<code>reportUnlocks</code>), tot de ontkoppeling op dag 15: betaalreferentie (Stripe PaymentIntent), bedrag, btw-bedrag en -tarief, valuta, datum, status, terugbetaaldatum, tijdstip van download, akkoordbewijs (tijdstip, versie van de voorwaarden, SHA-256 hash van de akkoordtekst), e-mailadres (versleuteld) + hash, eventuele antwoorden en beslissing van een moderator, SHA-256 hash van de kristal-code<br/>Vrijgaveregistratie na ontkoppeling: SHA-256 hash van de kristal-code, methode, status en de datums afgerond op de maand; de betaalreferentie is vervangen door een willekeurige waarde<br/>Betaalbewijzen (<code>paymentRecords</code>): per betaling en per terugbetaling een genummerd bewijs (PDF, zonder naam of e-mailadres) met betaalreferentie, bedrag, btw en akkoordbewijs; na de ontkoppeling niet meer te koppelen aan de vrijgaveregistratie<br/>Betaalpogingen (<code>payments</code>, tijdelijk): interne referentie, PaymentIntent-id, SHA-256 hash van de kristal-code, e-mailadres (AES-256-GCM versleuteld) + hash, opgegeven land, bij afwijzing het land van betaalkaart of factuuradres, bedrag, btw, status<br/>Webhookgebeurtenissen (<code>stripeEvents</code>): uitsluitend gebeurtenis-id, type en tijdstippen — geen persoonsgegevens<br/>E-mailadres bij de betaling: AES-256-GCM versleuteld + hash<br/>Grijze lijst (<code>refundGreylist</code>): e-mailadres (versleuteld) + hash, datum en betaalreferentie per terugbetaling<br/>Activatiecodes (<code>activationCodes</code>): uitsluitend hash, laatste vier tekens, label en tijdstippen — geen persoonsgegevens</td></tr>
          <tr><td style={S.td}>Bewaartermijn</td><td style={S.td}>Koppeling betaling ↔ rapport: tot dag 15 na de betaling (nachtelijke ontkoppeling). Bij een terugbetaling, of wanneer een beheerder de koppeling vasthoudt omdat een terugbetaling nog wordt verwerkt: ten hoogste 30 dagen langer. Bij de ontkoppeling worden betaalreferentie, bedrag, btw, akkoordbewijs, downloadtijdstip, e-mailadres, geschilgegevens en moderatorantwoorden van de vrijgaveregistratie verwijderd, eerst na het aanmaken van de betaalbewijzen.<br/>Vrijgaveregistratie (ontkoppeld): zolang de kristal-code geldig blijft — het bewijs dat de code een account mag openen, en na een terugbetaling de blokkade.<br/>Betaalbewijzen: 7 jaar (fiscaal).<br/>E-mailadres bij de betaling: automatisch verwijderd zodra de 14-dagen termijn is verstreken zonder terugbetaling (nachtelijke opruiming), uiterlijk bij de ontkoppeling.<br/>Grijze lijst: 2 jaar na de laatste terugbetaling (TTL-index).<br/>Betaalpogingen: onbetaald 30 dagen, betaald tot 1 dag na de 14-dagen termijn (TTL-index). Webhookgebeurtenissen: 30 dagen (TTL-index).<br/>Niet-vrijgegeven rapporten: de versleutelde code bestaat alleen in het tabblad en verdwijnt zodra de gebruiker de rapportpagina verlaat; de server verwijdert op dat moment de bijbehorende kaarttekst. Komt dat verwijderingssignaal niet aan, dan verloopt de versleutelde code na 24 uur en wordt de kaarttekst in de nachtelijke opruiming (00:00 Europe/Amsterdam) verwijderd.</td></tr>
          <tr><td style={S.td}>Gevolg van terugbetaling</td><td style={S.td}>De kristal-code wordt geblokkeerd. Was het de enige lezing van een account, dan wordt dat account volledig verwijderd (zelfde routine als accountverwijdering); anders wordt de inhoud van die lezing verwijderd en blijven de lezingen en toegang uit andere rapporten volledig staan. De betaalbewijzen (betaling en terugbetaling, als PDF) en de grijze lijst blijven bestaan; de koppeling tussen betaling en rapport blijft ten hoogste 30 dagen langer bestaan zodat de terugbetaling kan worden afgerond, en wordt daarna verbroken. Na de ontkoppeling kan een terugboeking (chargeback) of een terugbetaling die buiten het platform om via Stripe wordt gedaan niet meer aan het rapport worden gekoppeld en blokkeert zij de code niet.</td></tr>
          <tr><td style={S.td}>Geautomatiseerde besluitvorming (Art. 22)</td><td style={S.td}>Nee. De grijze lijst blokkeert geen aankopen en wijst niets automatisch af: bij een volgend terugbetalingsverzoek stelt een moderator vragen en beslist daarna tot terugbetalen of weigeren. Die beslissing en de antwoorden worden bij de vrijgaveregistratie bewaard tot de ontkoppeling.</td></tr>
          <tr><td style={S.td}>Ontvangers / doorgifte</td><td style={S.td}><strong style={S.strong}>Stripe Payments Europe, Limited (Dublin, Ierland, EU)</strong> — zelfstandig verwerkingsverantwoordelijke voor de betaalverwerking, btw-berekening en fraudepreventie; Garden For Life ontvangt geen kaart- of rekeninggegevens. Stripe kan gegevens doorgeven aan Stripe, Inc. (VS) onder het EU-VS Data Privacy Framework en standaardcontractbepalingen.<br/><strong style={S.strong}>MongoDB Atlas (Frankfurt, EU)</strong> — verwerker, opslag.<br/>Garden For Life zelf geeft deze gegevens niet door buiten de EU/EER; niets hiervan gaat naar Anthropic.</td></tr>
          <tr><td style={S.td}>Beveiligingsmaatregelen</td><td style={S.td}>Zie Verwerking 1. Aanvullend: e-mailadressen versleuteld op veldniveau; de kristal-code wordt tot de vrijgave versleuteld (AES-256-GCM, serversleutel) aan de browser meegegeven en nooit ruw opgeslagen; terugbetalen en het beheer van activatiecodes zijn uitsluitend voor de beheerder toegankelijk.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>7. Rechten van Betrokkenen</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Recht</th><th style={S.th}>Invulling</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Recht op inzage (Art. 15)</td><td style={S.td}>Gebruiker kan via yuanwullink30@gfl.community opvragen welke data is opgeslagen.</td></tr>
          <tr><td style={S.td}>Recht op verwijdering (Art. 17)</td><td style={S.td}>Gebruiker kan account en alle bijbehorende serverdata laten verwijderen. Verwijdering vindt plaats binnen 30 dagen. Betaalbewijzen en toestemmingsregistraties blijven zolang de wet of het bewijsbelang dat vereist; het maandelijkse aantal toegangsbewijzen verloopt vanzelf. Lokale browserdata (localStorage), de werkmap en de gegevensmap van de applicatie wist de gebruiker zelf.</td></tr>
          <tr><td style={S.td}>Recht op intrekking toestemming</td><td style={S.td}>Toestemming kan te allen tijde worden ingetrokken via yuanwullink30@gfl.community. Intrekking doet geen afbreuk aan de rechtmatigheid van eerdere verwerking.</td></tr>
          <tr><td style={S.td}>Recht op dataportabiliteit (Art. 20)</td><td style={S.td}>Op verzoek worden opgeslagen servergegevens in machine-leesbaar formaat (JSON) aangeleverd.</td></tr>
          <tr><td style={S.td}>Klachtrecht</td><td style={S.td}>Betrokkenen kunnen een klacht indienen bij de Autoriteit Persoonsgegevens (AP): <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#c4b5fd' }}>www.autoriteitpersoonsgegevens.nl</a> — 088 1805 250</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>8. Toestemmingsmechanisme (Art. 9 Vereiste)</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Aspect</th><th style={S.th}>Invulling</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Type toestemming</td><td style={S.td}>Uitdrukkelijke, specifieke, geïnformeerde toestemming conform Art. 9 lid 2 sub a AVG</td></tr>
          <tr><td style={S.td}>Moment van toestemming</td><td style={S.td}>Vóór aanvang van het assessment, via een specifiek toestemmingsscherm (los van de algemene gebruiksvoorwaarden). Twee afzonderlijke checkboxes: (1) algemene voorwaarden, (2) Art. 9 psychologische profieldata.</td></tr>
          <tr><td style={S.td}>Inhoud toestemmingsverklaring</td><td style={S.td}>De gebruiker wordt expliciet geïnformeerd over:<br/>• De verwerking van psychologische profieldata<br/>• Het doel (persoonlijke rapportage)<br/>• De verwerkingslocatie (Frankfurt; verwerking in het werkgeheugen van de server en door Claude/Anthropic)<br/>• Wie toegang heeft (niemand achteraf: het volledige profiel wordt niet opgeslagen, ook de beheerder heeft er geen toegang toe)<br/>• De bewaartermijn (niet opgeslagen: het volledige profiel bestaat alleen in het eigen browsertabblad tijdens de sessie; een niet-vrijgegeven rapport wordt verwijderd bij het verlaten van de rapportpagina; na inwisseling van een kristal-code blijft uitsluitend het gedeeltelijke profiel)<br/>• Het recht op verwijdering via yuanwullink30@gfl.community</td></tr>
          <tr><td style={S.td}>Vastlegging toestemming</td><td style={S.td}>Toestemming wordt met tijdstempel vastgelegd als toestemmingsregistratie en <strong style={S.strong}>7 jaar</strong> bewaard (TTL) als bewijs van rechtmatige verwerking (Art. 7 lid 1 AVG). De toestemming bij aanvang van het assessment bevat het type toestemming, het moment en de user-agent — geen account-id en geen e-mailadres. De toestemming bij het opslaan van de PDF bevat daarnaast het ingevulde e-mailadres, het niveau (kort of volledig rapport) en de user-agent; deze wordt bij accountverwijdering verwijderd als het e-mailadres overeenkomt met dat van het account.</td></tr>
          <tr><td style={S.td}>Intrekking</td><td style={S.td}>Gebruiker kan toestemming intrekken via yuanwullink30@gfl.community. Data wordt binnen 30 dagen verwijderd.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>9. AI-Transparantieverklaring (Art. 22 AVG &amp; EU AI Act)</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Aspect</th><th style={S.th}>Invulling</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>AI-model gebruikt</td><td style={S.td}>Claude (Anthropic) — Large Language Model<br/>Model: claude-fable-5-1 (of een opvolger van Anthropic; een wissel wordt vooraf in dit register vermeld)</td></tr>
          <tr><td style={S.td}>Rol van AI</td><td style={S.td}>Generatie van het persoonlijkheidsrapport op basis van de volledige assessmentdata en de Garden For Life Deltawerken Model instructielaag. De AI ontvangt: responses, subjectResults, scores, archetypeDetails, eventuele OCEAN-scores, de opgeschoonde tekst van een geüpload persoonlijkheidsrapport en systeeminstructies — geen naam, e-mail, IP of andere identificerende persoonsgegevens. De scores en archetypes zelf worden berekend door het Deltawerken-rekenmodel, niet door de AI. Hulpmiddelen in de desktopapplicatie die een AI-model gebruiken, doen dat via de anonieme gateway (Verwerking 5).</td></tr>
          <tr><td style={S.td}>Geen autonome besluitvorming</td><td style={S.td}>Het gegenereerde rapport vormt geen juridisch of klinisch bindend oordeel. Er worden geen besluiten over de gebruiker genomen op uitsluitend geautomatiseerde basis.</td></tr>
          <tr><td style={S.td}>Disclaimer in rapport</td><td style={S.td}>Het rapport bevat een expliciete vermelding dat de inhoud AI-gegenereerd is, gebaseerd op zelfingevulde assessmentdata, en dient als zelfreflectie-instrument — niet als klinische diagnose.</td></tr>
          <tr><td style={S.td}>Menselijke tussenkomst</td><td style={S.td}>De interpretatie van het rapport berust bij de gebruiker. Gebruikers kunnen via yuanwullink30@gfl.community vragen dat een medewerker van Garden For Life meekijkt; dit is geen psychologische of klinische beoordeling.</td></tr>
          <tr><td style={S.td}>EU AI Act positie</td><td style={S.td}><strong style={S.strong}>Beperkt risico (limited risk)</strong> — het systeem valt niet onder Bijlage III (hoog-risico). Geen inzet voor HR-, onderwijs- of kredietbeoordelingsdoeleinden. Aanbeveling: juridische verificatie bij opschaling naar B2B.</td></tr>
        </tbody>
      </table>

      <h2 style={S.h2}>10. Verwerkersovereenkomsten (Art. 28 AVG)</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Verwerker</th><th style={S.th}>Dienst</th><th style={S.th}>Status VOK</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Anthropic</td><td style={S.td}>Claude API — rapportgeneratie</td><td style={S.td}>Automatisch van kracht via acceptatie van Anthropic Commercial Terms of Service — maart 2026</td></tr>
          <tr><td style={S.td}>MongoDB Atlas</td><td style={S.td}>Databaseopslag Frankfurt (EU)</td><td style={S.td}>Aanwezig via Atlas DPA (online acceptatie)</td></tr>
          <tr><td style={S.td}>Render.com</td><td style={S.td}>Hosting applicatieserver Frankfurt (EU)</td><td style={S.td}>Aanwezig via Render DPA (online acceptatie)</td></tr>
          <tr><td style={S.td}>Google Workspace (gfl.community)</td><td style={S.td}>E-mail via Gmail</td><td style={S.td}>Gedekt door Google Workspace DPA (automatisch van toepassing)</td></tr>
          <tr><td style={S.td}>Cloudflare</td><td style={S.td}>Webhosting / CDN; R2-opslag en uitlevering van de installatiebestanden en updates van de desktopapplicatie</td><td style={S.td}>Automatisch via Self-Serve Subscription Agreement</td></tr>
          <tr><td style={S.td}>Stripe Payments Europe, Limited</td><td style={S.td}>Betaalverwerking en btw-berekening (Verwerking 6)</td><td style={S.td}>Geen VOK: Stripe is voor de betaalverwerking zelfstandig verwerkingsverantwoordelijke (Stripe Services Agreement en privacyverklaring) [Verificatie aanbevolen]</td></tr>
        </tbody>
      </table>

      <div style={S.warn}>
        <p style={{ ...S.p, margin: 0 }}><strong style={{ color: '#fb923c' }}>Opmerking:</strong> Dit register is opgesteld als werkinstrument en basis voor juridische toetsing. Aanbevolen wordt dit document te laten reviewen door een in AVG gespecialiseerde Nederlandse jurist, in het bijzonder de verwerkingen onder Art. 9 AVG en de AI Act classificatie. Dit document vervangt geen formeel privacybeleid of verwerkersovereenkomsten.</p>
      </div>

      <p style={{...S.p, textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '1rem'}}>Garden For Life — Verwerkingsregister | Versie 3.1 | 27 september 2026</p>
    </>
  ),
};
