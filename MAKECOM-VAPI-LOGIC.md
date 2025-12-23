# 📞 Logique Make.com pour gérer les statuts d'appels

## Architecture du scénario

```
Webhook Supabase (triggers table) 
  → Router 
    → Branch 1: start_calling = true → Appeler les leads via Vapi
    → Branch 2: start_qualifying = true → Qualifier les leads
```

---

## Module 1 : Détecter le déclenchement d'appel

**Webhook Supabase** déclenché sur UPDATE de `triggers` table

Filtrer sur : `start_calling = true`

---

## Module 2 : Récupérer les leads à appeler

**Supabase - Search Rows**

```
Table: leads
Filter: status = 'cold' OR status = 'warm' OR status = 'hot'
        AND lead_type = 'outbound'
        AND phone IS NOT NULL
Limit: 10
```

---

## Module 3 : Pour chaque lead, passer le statut à "called"

**Iterator** sur les leads

Puis **Supabase - Update Row**

```json
{
  "table": "leads",
  "id": "{{lead.id}}",
  "data": {
    "status": "called",
    "last_called_at": "{{now}}",
    "metadata": {
      "called": true,
      "call_initiated_at": "{{now}}"
    }
  }
}
```

---

## Module 4 : Appeler via Vapi

**HTTP Request - POST** vers Vapi API

```json
{
  "url": "https://api.vapi.ai/call",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_VAPI_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "phoneNumber": "{{lead.phone}}",
    "assistantId": "YOUR_VAPI_ASSISTANT_ID",
    "metadata": {
      "lead_id": "{{lead.id}}",
      "lead_name": "{{lead.name}}"
    }
  }
}
```

---

## Module 5 : Webhook de retour Vapi (après appel)

Créer un **nouveau scénario** déclenché par webhook Vapi

**Webhook Trigger** : URL à configurer dans Vapi Dashboard

Vapi enverra un payload avec :
```json
{
  "callId": "...",
  "status": "completed",
  "duration": 45,
  "transcript": "Bonjour, je suis intéressé...",
  "metadata": {
    "lead_id": "uuid-du-lead"
  },
  "analysis": {
    "sentiment": "positive",
    "interested": true
  }
}
```

---

## Module 6 : Router basé sur l'intérêt du lead

**Router** avec 2 branches :

### Branch A : Lead intéressé
**Filter** : `analysis.interested = true` OU transcript contient "intéressé|oui|d'accord"

**Supabase - Update Row**
```json
{
  "table": "leads",
  "id": "{{metadata.lead_id}}",
  "data": {
    "status": "interested",
    "transcript": "{{transcript}}",
    "metadata": {
      "called": true,
      "texted": false,
      "call_duration": "{{duration}}",
      "sentiment": "positive"
    }
  }
}
```

### Branch B : Lead non intéressé
**Filter** : `analysis.interested = false` OU transcript contient "non|pas intéressé|rappeler"

**Supabase - Update Row**
```json
{
  "table": "leads",
  "id": "{{metadata.lead_id}}",
  "data": {
    "status": "not_interested",
    "transcript": "{{transcript}}",
    "metadata": {
      "called": true,
      "texted": false,
      "call_duration": "{{duration}}",
      "sentiment": "negative"
    }
  }
}
```

---

## Module 7 : Logger l'activité (optionnel)

**Supabase - Insert Row** dans `automation_logs`

```json
{
  "table": "automation_logs",
  "data": {
    "action_type": "call_completed",
    "status": "success",
    "details": {
      "lead_id": "{{metadata.lead_id}}",
      "call_duration": "{{duration}}",
      "final_status": "{{status}}"
    }
  }
}
```

---

## ✅ Résumé du flux

1. **Dashboard** → Clic sur "Start Calling"
2. **Supabase** → `start_calling = true` dans triggers
3. **Make.com Webhook** → Détecte le changement
4. **Make.com** → Récupère leads à appeler
5. **Make.com** → Met status à "called" + appelle Vapi
6. **Vapi** → Effectue l'appel
7. **Vapi Webhook** → Envoie résultat à Make.com
8. **Make.com** → Met à jour status : "interested" ou "not_interested"
9. **Dashboard** → Affiche badge "Called" + nouveau status

---

## 🔧 Configuration Vapi

Dans Vapi Dashboard :
1. Créer un Assistant avec ton script d'appel
2. Configurer le **Server URL** (webhook) : URL de ton scénario Make.com
3. Activer **End-of-call Analysis** pour avoir `analysis.interested`

---

## 🎯 Bonus : Gérer les SMS

Pour les leads "texted", même logique :

**Module SMS** (Twilio/MessageBird)
```json
{
  "to": "{{lead.phone}}",
  "body": "Bonjour {{lead.name}}, je vous contacte au sujet de..."
}
```

**Puis Update**
```json
{
  "status": "texted",
  "last_texted_at": "{{now}}",
  "metadata": {
    "called": false,
    "texted": true
  }
}
```
