# Founder's Thesis — Health Companion

> Notes from Dr. Juan Manuel Fraga Sastrías, transcribed and organized.
> April 2026.
>
> **Purpose**: to capture the "why" of the project in the founder's voice. This document is the soul of the product — every technical artifact (`concept-v1`, the Claude Code brief) must serve this thesis.

---

## 1. The root problem: the incentives of the system are inverted

The health system today **profits when people get sick**. Hospitals, visits, pharmacy — the entire edifice runs on the engine of illness. Nobody is paid to keep you well.

Eric Topol anticipated this in *The Patient Will See You Now* (2015) and deepened it in *Deep Medicine* (2019): medicine has to be inverted. The patient as owner of their own health, the clinician as advisor, AI as the layer that makes it possible. Ten years later, the technology to do it exists.

---

## 2. How health is experienced today

The patient lives through a fragmented, friction-heavy journey:

- Gets sick → calls the ambulance / goes to the hospital / books an appointment.
- The visit is loaded with **anxiety and uncertainty**.
- Doctors use technical language that the patient **barely understands**.
- Leaves with questions, buys medications, makes adherence mistakes, deteriorates, comes back into the system. **Vicious cycle.**
- When seeing multiple specialists, **the patient becomes the involuntary messenger** carrying information from one physician to the next. Even with electronic medical records, there is no clinical team integrated *around* them.
- **No actor in the system is focused on keeping health** — everyone is focused on treating disease.

---

## 3. The vision of Health Companion

An application that reorients the system toward **proactive care**, where:

- The patient is **the owner of their health**, not a passive subject of the system.
- Providers integrate through a common layer of information and accompaniment.
- **Costs go down** — for the system, for insurers, and for the patient.

---

## 4. Three educational goals of the product

In this exact order:

1. **Empower** the user to take responsibility for their own health.
2. **Motivate and incentivize** the maintenance of health (not only the treatment of disease).
3. **Understand without jargon**: let the patient grasp their own state of health and their options for intervention **without needing to speak the language of medicine**.

---

## 5. The natural history of disease — and where we intervene

Medical school teaches that every disease moves through three stages.

**Stage 1 — Health.** The person is well. They have their routines, their habits, their way of eating, sleeping, moving, carrying stress. Nothing is happening to them. No one calls them a patient. The system does not know they exist.

**Stage 2 — Preclinical.** Something has started to change, but nothing shows. Blood pressure creeps half a point each year. A lab value drifts across every panel. Muscle mass slips by half a kilo a year after thirty. The person feels fine. The system has no reason to engage, because the person is not looking for it — and the only thing that would find the change is a screening nobody asked them to get.

**Stage 3 — Clinical.** The symptom appears, or a screening catches the finding, and the person finally touches the system. This is where modern medicine shines — and where it most often fails. It shines because it knows how to treat. It fails because we arrive late. The later we arrive, the more it costs, the more complicated it becomes, the worse the outcomes, and the less often we return the person to the level of health they had before.

Draw it as a line: flat through Stage 1. Sloping downward through the preclinical window, invisibly. Then steepening in Stage 3 — and with treatment, recovering some ground, but rarely all of it. The area under the curve is the human cost.

What medical school did not teach — what I had to learn across twenty years of practice — is that **Stage 1 is not a passive state**. In the health stage, the person is either **building their present and future health every day, or eroding it every day**. The difference between arriving strong at sixty and arriving fragile is not made by the diagnosis someone receives at fifty-two. It is made during the two decades when nobody was watching.

This is where Health Companion wants to live.

The ambition of the product is to meet the person **before** the preclinical stage — and at worst, to find them inside it, before the symptom opens the door to the system. Then not only to hold the line, but to lift it: leave the person measurably better than when we met. A life measured not against a diagnosis avoided, but against a level of health actively built.

This is also why the product measures itself differently. Not by how many diagnoses it catches — that is consequence, not purpose. By how many years of real health it adds before the system had reason to call the person a patient at all.

---

## 6. Two levels of prevention

### Primary prevention — avoid getting sick
Proactive accompaniment with personalized, non-invasive reminders, in everyday language.

### Secondary prevention — when illness is already present, avoid complications
- Understand the illness better.
- Ask **the right questions** of the doctor.
- Know and interpret **one's own clinical indicators**.
- Improve adherence and reduce errors.

---

## 7. The central metaphor: the old family doctor, but digital

> **"A friend who knows health."**
>
> **"The family doctor of decades ago — the one who knew you and your family — but now digital."**

This is the product's emotional line. Competitors (symptom checkers, trackers, Big Tech chatbots) sell cold tools. Health Companion sells **a relationship**.

Characteristics of that relationship:

- **Proactive without being invasive**: it reaches out when it matters, it does not bombard.
- **Personalized**: it knows your history, your family, your story, your habits.
- **Everyday language**: it translates medicine into the Spanish (or English) you actually speak.
- **Continuous**: it grows with you. Every interaction makes it more valuable.

---

## 8. The "sanitary interpreter" — the underlying differentiator

The app works as a **translator between medical language and everyday language**. It is health literacy delivered through conversation, personalized to the user's profile.

This is not a feature — it is a new category. Today no product exists whose only job is **to interpret medicine for you**.

---

## 9. The equity dimension — key to the pitch

The app **works in both contexts**:

- **High-resource settings**: where resources already exist but the system is transactional and fragmented.
- **Lower-resource settings (LatAm, the Global South)**: where the medical system is even more fragmented, specialists are scarce, and the patient has no access to a family physician.

**In low-resource contexts, the relative value is higher**, because it fills a real gap: someone without a family doctor suddenly **has a digital one**.

This makes Health Companion a clear case of **AI for beneficial outcomes** — directly aligned with Anthropic's mission.

---

## 10. Implications for Claude Code

Every product decision must pass through this filter:

- Does this feature **empower, motivate, or educate without jargon**?
- Does it feel like **a friend who knows health**, or like a cold chatbot?
- Does it work just as well **in a low-resource context** as in a high-resource one?
- Does it bring the user closer to **owning their health**, or does it keep them dependent on the reactive system?

If any answer is "no", the feature does not belong in the MVP.

---

## 11. Seed phrase for the pitch

> *"The health system today gets paid when you get sick. We're building the first companion whose only job is to keep you well — in the language you actually speak."*

(To be iterated with the final hook, numbers, and the bridge to Topol and Opus 4.7.)
