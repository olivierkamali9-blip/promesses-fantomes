begin;

insert into public.pledges (
  id, question, criteria, deadline, tier, state, evidence_level,
  category, scenario_label, unconfirmed, ai_confidence
) values
(
  'seed-fc-demo-final',
  'Le FC Démo remportera-t-il la finale contre l’AS Test ?',
  'Le résultat officiel fictif après 90 minutes et les prolongations éventuelles désigne le FC Démo vainqueur.',
  now() + interval '7 days',
  'GREEN', 'APPARITION', 3, 'SPORT', 'Fictional demo scenario', false, 0.86
),
(
  'seed-ville-exemple-navette',
  'La Mairie de Ville-Exemple lancera-t-elle la navette nocturne avant l’échéance ?',
  'Une navette fictive doit effectuer un trajet public complet avant l’échéance.',
  now() + interval '14 days',
  'ORANGE', 'APPARITION', 1, 'POLITICS', 'Fictional demo scenario', true, 0.61
)
on conflict (id) do nothing;

insert into public.sources (pledge_id, url, kind, independent_group, label) values
('seed-fc-demo-final', 'https://example.org/ligue-demo', 'reliable', 'ligue-demo', 'Ligue Démo'),
('seed-fc-demo-final', 'https://example.org/stade-test', 'reliable', 'stade-test', 'Stade Test'),
('seed-ville-exemple-navette', 'https://example.org/ville-exemple', 'statement', 'mairie-ville-exemple', 'Annonce fictive de Ville-Exemple')
on conflict (pledge_id, url, independent_group) do nothing;

commit;
