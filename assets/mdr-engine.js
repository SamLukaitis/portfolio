/*
 * EU MDR 2017/745 Annex VIII classifier - browser port.
 *
 * A line-for-line JavaScript port of rules_engine/eu_mdr/rules.py, engine.py
 * and standards_mapper/eu_mdr/requirements.py, so the portfolio demo still
 * works with no server. tests/test_js_parity.py runs this file under Node
 * against thousands of random devices and requires identical results to the
 * Python engine (class, qualifiers, every rule's outcome, applicable GSPRs
 * and standards). Change the Python first, then this file, then rerun that test.
 *
 * Educational demo only - not regulatory advice.
 */
(function (root) {
  "use strict";

  var RANK = { I: 0, IIa: 1, IIb: 2, III: 3 };
  var SRC = "Regulation (EU) 2017/745, Annex VIII, Chapter III";

  var DEFAULTS = {
    name: "",
    invasiveness: "non_invasive",
    duration: "not_applicable",
    is_implantable: false,
    is_active: false,
    active_type: "not_active",
    is_software: false,
    drives_or_influences_device_class: null,
    placed_on_market_sterile: false,
    has_measuring_function: false,
    is_reusable_surgical_instrument: false,
    body_orifice_site: "not_applicable",
    liable_to_be_absorbed_by_mucous_membrane: false,
    connected_to_active_device_class: null,
    contacts_heart_or_central_circulatory_system: false,
    contacts_central_nervous_system: false,
    placed_in_teeth: false,
    is_spinal_disc_replacement_or_contacts_spinal_column: false,
    is_joint_replacement: false,
    is_breast_implant_or_surgical_mesh: false,
    is_active_implantable_or_accessory: false,
    is_ancillary_component: false,
    supplies_ionising_radiation: false,
    has_biological_effect_or_wholly_mainly_absorbed: false,
    undergoes_chemical_change_in_body: false,
    administers_medicinal_product: false,
    administration_potentially_hazardous: false,
    channels_or_stores_for_infusion_administration_or_introduction: false,
    storage_target: "none",
    modifies_biological_or_chemical_composition: false,
    modification_treatment_type: "none",
    in_vitro_direct_contact_with_cells_tissues_organs_or_embryos: false,
    contacts_injured_skin_or_mucous_membrane: false,
    wound_contact_purpose: "none",
    administers_or_exchanges_energy: false,
    energy_exchange_potentially_hazardous: false,
    controls_monitors_or_influences_therapeutic_class_iib_device: false,
    emits_ionising_radiation_therapeutic: false,
    emits_ionising_radiation_diagnostic_or_interventional: false,
    controls_monitors_or_influences_active_implantable_device: false,
    diagnostic_supplies_energy_absorbed_by_body: false,
    diagnostic_illuminates_patient_visible_spectrum_only: false,
    diagnostic_images_in_vivo_radiopharmaceutical_distribution: false,
    diagnostic_allows_direct_diagnosis_or_monitoring_of_vital_physiological_processes: false,
    diagnostic_variation_could_cause_immediate_danger: false,
    software_decision_impact: "not_applicable",
    software_monitors_physiological_processes: false,
    software_monitors_vital_parameters_with_immediate_danger_potential: false,
    administers_or_removes_substances_to_from_body: false,
    administration_or_removal_potentially_hazardous: false,
    contains_ancillary_medicinal_substance: false,
    is_contraceptive_or_sti_prevention: false,
    disinfect_clean_target: "none",
    is_xray_diagnostic_image_recording_device: false,
    contains_human_or_animal_tissue_or_cells: false,
    tissue_origin: "none",
    tissue_contacts_intact_skin_only: false,
    contains_nanomaterial: false,
    nanomaterial_internal_exposure_potential: "none",
    administers_medicinal_product_by_inhalation: false,
    inhalation_essential_impact_or_life_threatening: false,
    composed_of_substances_absorbed_or_dispersed_via_orifice_or_skin: false,
    systemically_absorbed: false,
    achieves_purpose_in_stomach_or_lower_gi_tract: false,
    applied_to_skin_or_nasal_oral_cavity_to_pharynx: false,
    is_active_therapeutic_with_integrated_diagnostic_function: false,
  };

  function highest(list) {
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c != null && (best == null || RANK[c] > RANK[best])) best = c;
    }
    return best;
  }

  // Annex VIII 3.5: among matched candidates, the highest class wins.
  function candidates(list) {
    var m = [];
    for (var i = 0; i < list.length; i++) if (list[i][0]) m.push(list[i][1]);
    return m.length ? highest(m) : null;
  }

  // "Class BASE unless X, in which case Y": a matched exception replaces the base.
  function withBase(gate, base, exceptions) {
    if (!gate) return null;
    var m = [];
    for (var i = 0; i < exceptions.length; i++) if (exceptions[i][0]) m.push(exceptions[i][1]);
    return m.length ? highest(m) : base;
  }

  function out(id, section, applies, cls, why, extra) {
    var o = { rule_id: id, applies: !!applies, device_class: cls, rationale: why, source_citation: SRC + ", Section " + section, ambiguous: false, ambiguous_note: null };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  var ORAL_EAR_NASAL = { oral_cavity_to_pharynx: 1, ear_canal_to_eardrum: 1, nasal_cavity: 1 };
  var HIGHER_ACTIVE = { IIa: 1, IIb: 1, III: 1 };

  var RULES = [
    function rule1(d) {
      var a = d.invasiveness === "non_invasive";
      return out("Rule 1", "4.1", a, a ? "I" : null, a ? "Non-invasive device: Class I unless a more specific rule (2-4) gives a higher class." : "Device is not non-invasive.");
    },
    function rule2(d) {
      var gate = d.invasiveness === "non_invasive" && d.channels_or_stores_for_infusion_administration_or_introduction;
      var conn = gate && !!HIGHER_ACTIVE[d.connected_to_active_device_class];
      var bag = gate && d.storage_target === "blood_bags";
      var blood = gate && (d.storage_target === "blood_or_other_body_liquids" || d.storage_target === "organs_cells_tissues") && !bag;
      var rest = gate && !(conn || bag || blood);
      var c = candidates([[conn, "IIa"], [blood, "IIa"], [bag, "IIb"], [rest, "I"]]);
      return out("Rule 2", "4.2", gate, c, gate ? "Non-invasive device channelling or storing blood, body liquids, cells, tissues, liquids or gases for eventual administration into the body." : "Not a non-invasive channelling/storage device.");
    },
    function rule3(d) {
      var ni = d.invasiveness === "non_invasive";
      var mod = ni && d.modifies_biological_or_chemical_composition;
      var vitro = ni && d.in_vitro_direct_contact_with_cells_tissues_organs_or_embryos;
      var filt = d.modification_treatment_type === "filtration_centrifugation_gas_or_heat_exchange";
      var c = candidates([[mod && filt, "IIa"], [mod && !filt, "IIb"], [vitro, "III"]]);
      var a = mod || vitro;
      return out("Rule 3", "4.3", a, c, a ? "Non-invasive device modifying the biological or chemical composition of tissues, cells, blood or other body liquids, or a substance used in vitro with human cells, tissues, organs or embryos." : "Does not modify biological/chemical composition.");
    },
    function rule4(d) {
      var g = d.contacts_injured_skin_or_mucous_membrane;
      var p = d.wound_contact_purpose;
      var known = p === "mechanical_barrier_compression_or_absorption" || p === "breached_dermis_secondary_intent_healing" || p === "manage_microenvironment";
      var c = candidates([
        [g && p === "mechanical_barrier_compression_or_absorption", "I"],
        [g && p === "breached_dermis_secondary_intent_healing", "IIb"],
        [g && p === "manage_microenvironment", "IIa"],
        [g && !known, "IIa"],
      ]);
      return out("Rule 4", "4.4", g, c, g ? "Device contacts injured skin or mucous membrane; its wound-contact purpose ('" + p + "') sets the class." : "No contact with injured skin or mucous membrane.");
    },
    function rule5(d) {
      var orifice = d.invasiveness === "invasive_body_orifice";
      var notConn = d.connected_to_active_device_class == null || d.connected_to_active_device_class === "I";
      var dg = orifice && notConn;
      var ex = !!ORAL_EAR_NASAL[d.body_orifice_site];
      var connHi = orifice && !!HIGHER_ACTIVE[d.connected_to_active_device_class];
      var absorbed = d.liable_to_be_absorbed_by_mucous_membrane;
      var c = candidates([
        [dg && d.duration === "transient", "I"],
        [dg && d.duration === "short_term" && ex, "I"],
        [dg && d.duration === "short_term" && !ex, "IIa"],
        [dg && d.duration === "long_term" && ex && !absorbed, "IIa"],
        [dg && d.duration === "long_term" && !(ex && !absorbed), "IIb"],
        [connHi, "IIa"],
      ]);
      var a = dg || connHi;
      return out("Rule 5", "5.1", a, c, a ? "Invasive via a body orifice (not surgically); duration '" + d.duration + "', site '" + d.body_orifice_site + "'." : "Not a non-surgical body-orifice device.");
    },
    function rule6(d) {
      var g = d.invasiveness === "surgically_invasive" && d.duration === "transient" && !d.is_implantable;
      var heart = d.contacts_heart_or_central_circulatory_system;
      var c = withBase(g, "IIa", [
        [heart, "III"],
        [d.is_reusable_surgical_instrument, "I"],
        [heart || d.contacts_central_nervous_system, "III"],
        [d.supplies_ionising_radiation, "IIb"],
        [d.has_biological_effect_or_wholly_mainly_absorbed, "IIb"],
        [d.administers_medicinal_product && d.administration_potentially_hazardous, "IIb"],
      ]);
      return out("Rule 6", "5.2", g, c, g ? "Surgically invasive device for transient use (under 60 minutes)." : "Not a transient-use surgically invasive device.");
    },
    function rule7(d) {
      var g = d.invasiveness === "surgically_invasive" && d.duration === "short_term" && !d.is_implantable;
      var heart = d.contacts_heart_or_central_circulatory_system;
      var c = withBase(g, "IIa", [
        [heart, "III"],
        [heart || d.contacts_central_nervous_system, "III"],
        [d.supplies_ionising_radiation, "IIb"],
        [d.has_biological_effect_or_wholly_mainly_absorbed, "III"],
        [d.undergoes_chemical_change_in_body && !d.placed_in_teeth, "IIb"],
        [d.administers_medicinal_product, "IIb"],
      ]);
      return out("Rule 7", "5.3", g, c, g ? "Surgically invasive device for short-term use (60 minutes to 30 days)." : "Not a short-term surgically invasive device.");
    },
    function rule8(d) {
      var g = d.is_implantable || (d.invasiveness === "surgically_invasive" && d.duration === "long_term");
      var joint = d.is_joint_replacement && !d.is_ancillary_component;
      var spine = d.is_spinal_disc_replacement_or_contacts_spinal_column && !d.is_ancillary_component;
      var c = withBase(g, "IIb", [
        [d.placed_in_teeth, "IIa"],
        [d.contacts_heart_or_central_circulatory_system || d.contacts_central_nervous_system, "III"],
        [d.has_biological_effect_or_wholly_mainly_absorbed, "III"],
        [d.undergoes_chemical_change_in_body && !d.placed_in_teeth, "III"],
        [d.administers_medicinal_product, "III"],
        [d.is_active_implantable_or_accessory, "III"],
        [d.is_breast_implant_or_surgical_mesh, "III"],
        [joint, "III"],
        [spine, "III"],
      ]);
      var amb = !!(g && d.is_ancillary_component && (d.is_joint_replacement || d.is_spinal_disc_replacement_or_contacts_spinal_column));
      return out("Rule 8", "5.4", g, c, g ? "Implantable device or long-term (over 30 days) surgically invasive device." : "Not implantable and not long-term surgically invasive.", {
        ambiguous: amb,
        ambiguous_note: amb ? "Ancillary component (screw, wedge, plate) of a joint or spinal implant: the rule exempts these from Class III, but MDCG 2021-24 says each must still be classified on its own intended purpose." : null,
      });
    },
    function rule9(d) {
      var eg = d.is_active && d.active_type === "therapeutic" && d.administers_or_exchanges_energy;
      var ctl = d.is_active && d.controls_monitors_or_influences_therapeutic_class_iib_device;
      var rad = d.is_active && d.emits_ionising_radiation_therapeutic;
      var aimd = d.is_active && d.controls_monitors_or_influences_active_implantable_device;
      var c = candidates([[eg, "IIa"], [eg && d.energy_exchange_potentially_hazardous, "IIb"], [ctl, "IIb"], [rad, "IIb"], [aimd, "III"]]);
      var a = eg || ctl || rad || aimd;
      return out("Rule 9", "6.1", a, c, a ? "Active therapeutic device giving or exchanging energy, or controlling a IIb therapeutic or active implantable device, or emitting therapeutic ionising radiation." : "Not an active therapeutic energy device.");
    },
    function rule10(d) {
      var dg = d.is_active && d.active_type === "diagnostic_monitoring";
      var rg = d.is_active && d.emits_ionising_radiation_diagnostic_or_interventional;
      var energy = dg && d.diagnostic_supplies_energy_absorbed_by_body;
      var light = energy && d.diagnostic_illuminates_patient_visible_spectrum_only;
      var direct = dg && d.diagnostic_allows_direct_diagnosis_or_monitoring_of_vital_physiological_processes;
      var danger = direct && d.diagnostic_variation_could_cause_immediate_danger;
      var c = candidates([
        [energy && !light, "IIa"],
        [light, "I"],
        [dg && d.diagnostic_images_in_vivo_radiopharmaceutical_distribution, "IIa"],
        [direct && !danger, "IIa"],
        [danger, "IIb"],
        [rg, "IIb"],
      ]);
      var a = dg || rg;
      return out("Rule 10", "6.2", a, c, a ? "Active device for diagnosis or monitoring, and/or emitting ionising radiation for diagnostic or interventional radiology." : "Not an active diagnostic/monitoring device.");
    },
    function rule11(d) {
      if (!d.is_software) return out("Rule 11", "6.3", false, null, "Not software.");
      if (d.drives_or_influences_device_class != null) {
        var dc = d.drives_or_influences_device_class;
        var o = out("Rule 11", "6.3", true, dc, "Software that drives or influences another device takes that device's class (Class " + dc + "), per Annex VIII Chapter II, point 3.3.");
        o.source_citation = "Regulation (EU) 2017/745, Annex VIII, Chapter II, point 3.3";
        return o;
      }
      var imp = d.software_decision_impact;
      var ds = imp !== "not_applicable";
      var mon = d.software_monitors_physiological_processes;
      var vital = d.software_monitors_vital_parameters_with_immediate_danger_potential;
      var c = candidates([
        [ds && imp === "other_impact", "IIa"],
        [ds && imp === "serious_deterioration_or_surgical_intervention", "IIb"],
        [ds && imp === "death_or_irreversible_deterioration", "III"],
        [mon && !vital, "IIa"],
        [mon && vital, "IIb"],
        [!ds && !mon, "I"],
      ]);
      var flag = ds && (imp === "serious_deterioration_or_surgical_intervention" || imp === "death_or_irreversible_deterioration");
      return out("Rule 11", "6.3", true, c, "Software; decision-support impact '" + imp + "', monitors physiological processes: " + (mon ? "yes" : "no") + ".", {
        ambiguous: flag,
        ambiguous_note: flag ? "MDCG 2021-24 says software severity depends on context (population, ICU vs home use, the decisions informed); the same function can change class." : null,
      });
    },
    function rule12(d) {
      var g = d.is_active && d.administers_or_removes_substances_to_from_body;
      var hz = d.administration_or_removal_potentially_hazardous;
      var c = candidates([[g && !hz, "IIa"], [g && hz, "IIb"]]);
      return out("Rule 12", "6.4", g, c, g ? "Active device giving or removing medicines, body liquids or other substances." : "Does not administer or remove substances.");
    },
    function rule13(d) {
      var a = d.is_active && d.active_type === "other_active";
      return out("Rule 13", "6.5", a, a ? "I" : null, a ? "Active device not covered by Rules 9-12." : "Not in the residual 'other active' group.");
    },
    function rule14(d) {
      var a = d.contains_ancillary_medicinal_substance;
      return out("Rule 14", "7.1", a, a ? "III" : null, a ? "Incorporates a medicinal substance with an action ancillary to the device." : "No ancillary medicinal substance.");
    },
    function rule15(d) {
      var g = d.is_contraceptive_or_sti_prevention;
      var lt = d.is_implantable || (d.invasiveness === "surgically_invasive" && d.duration === "long_term");
      var c = candidates([[g && !lt, "IIb"], [g && lt, "III"]]);
      return out("Rule 15", "7.2", g, c, g ? "Used for contraception or to prevent transmission of STIs." : "Not a contraception/STI-prevention device.");
    },
    function rule16(d) {
      var t = d.disinfect_clean_target;
      var c = candidates([[t === "contact_lenses", "IIb"], [t === "invasive_device_end_point", "IIb"], [t === "other_medical_device", "IIa"]]);
      var a = c != null;
      return out("Rule 16", "7.3", a, c, a ? "Intended specifically to disinfect, clean or sterilise ('" + t + "')." : "Not a disinfecting/sterilising device (or physical cleaning only).");
    },
    function rule17(d) {
      var a = d.is_xray_diagnostic_image_recording_device;
      return out("Rule 17", "7.4", a, a ? "IIa" : null, a ? "Records diagnostic images generated by X-rays." : "Not an X-ray image recording device.");
    },
    function rule18(d) {
      var g = d.contains_human_or_animal_tissue_or_cells;
      var carve = g && d.tissue_origin === "animal" && d.tissue_contacts_intact_skin_only;
      var c = g && !carve ? "III" : carve ? "I" : null;
      return out("Rule 18", "7.5", g, c, g && !carve ? "Made using non-viable human or animal tissue or cells." : carve ? "Animal tissue touching intact skin only: outside Rule 18, Class I via Rule 1 (MDCG 2021-24 Note 3)." : "No human/animal tissue or cells.");
    },
    function rule19(d) {
      var g = d.contains_nanomaterial;
      var e = d.nanomaterial_internal_exposure_potential;
      var c = candidates([[g && (e === "high" || e === "medium"), "III"], [g && e === "low", "IIb"], [g && e === "negligible", "IIa"]]);
      return out("Rule 19", "7.6", g, c, g ? "Contains nanomaterial with '" + e + "' potential for internal exposure." : "No nanomaterial.");
    },
    function rule20(d) {
      var g = d.invasiveness === "invasive_body_orifice" && d.administers_medicinal_product_by_inhalation;
      var hi = d.inhalation_essential_impact_or_life_threatening;
      var c = candidates([[g && !hi, "IIa"], [g && hi, "IIb"]]);
      return out("Rule 20", "7.7", g, c, g ? "Body-orifice device giving medicines by inhalation." : "Not an inhalation device.");
    },
    function rule21(d) {
      var g = d.composed_of_substances_absorbed_or_dispersed_via_orifice_or_skin;
      var sys = d.systemically_absorbed;
      var local = g && d.applied_to_skin_or_nasal_oral_cavity_to_pharynx && !sys;
      var c = candidates([[g && sys, "III"], [g && d.achieves_purpose_in_stomach_or_lower_gi_tract && sys, "III"], [local, "IIa"], [g && !local && !sys, "IIb"]]);
      return out("Rule 21", "7.8", g, c, g ? "Substance-based device introduced via an orifice or applied to skin, absorbed or locally dispersed." : "Not a substance-based device.");
    },
    function rule22(d) {
      var a = d.is_active && d.is_active_therapeutic_with_integrated_diagnostic_function;
      return out("Rule 22", "7.9", a, a ? "III" : null, a ? "Active therapeutic device with an integrated diagnostic function that largely determines patient management (e.g. closed loop, AED)." : "No integrated diagnostic function driving therapy.");
    },
  ];

  function normalise(input) {
    var d = {};
    for (var k in DEFAULTS) d[k] = input && Object.prototype.hasOwnProperty.call(input, k) ? input[k] : DEFAULTS[k];
    return d;
  }

  function classify(input) {
    var d = normalise(input);
    var all = RULES.map(function (r) { return r(d); });
    var triggered = all.filter(function (o) { return o.applies && o.device_class != null; });
    var cls = highest(triggered.map(function (o) { return o.device_class; }));
    var q = [];
    if (cls === "I") {
      if (d.placed_on_market_sterile) q.push("Is");
      if (d.has_measuring_function) q.push("Im");
      if (d.is_reusable_surgical_instrument) q.push("Ir");
    }
    return { device_class: cls, qualifiers: q, triggered_rules: triggered, all_rule_outcomes: all, device: d };
  }

  // --- standards mapping (Annex I GSPR categories) -------------------------
  function std(id, title, note) { return { standard_id: id, title: title, note: note || "" }; }

  function bioContact(d) {
    return d.invasiveness !== "non_invasive" || d.is_implantable || d.contacts_injured_skin_or_mucous_membrane ||
      d.contacts_heart_or_central_circulatory_system || d.contacts_central_nervous_system ||
      d.in_vitro_direct_contact_with_cells_tissues_organs_or_embryos || d.tissue_contacts_intact_skin_only ||
      d.placed_in_teeth || d.is_spinal_disc_replacement_or_contacts_spinal_column || d.is_joint_replacement ||
      d.is_breast_implant_or_surgical_mesh;
  }

  var GSPR = [
    ["risk_management", "Risk management system", "Annex I, Section 3", function () { return true; }, function () { return [std("ISO 14971", "Application of risk management to medical devices")]; }],
    ["quality_management_system", "Quality management system", "Article 10(9)", function () { return true; }, function () { return [std("ISO 13485", "Quality management systems - Requirements for regulatory purposes")]; }],
    ["clinical_evaluation", "Clinical evaluation", "Article 61(1), Annex XIV", function () { return true; }, function () { return [std("ISO 14155", "Clinical investigation of medical devices for human subjects - Good clinical practice", "Only if the route involves a clinical investigation.")]; }],
    ["labeling_and_ifu", "Label and instructions for use", "Annex I, Section 23", function () { return true; }, function () { return [std("ISO 15223-1", "Symbols to be used with information supplied by the manufacturer"), std("ISO 20417", "Information to be supplied by the manufacturer")]; }],
    ["biocompatibility", "Biological safety / biocompatibility", "Annex I, Sections 10.1(b), 10.2", bioContact, function () { return [std("ISO 10993-1", "Biological evaluation - Evaluation and testing within a risk management process", "Framework standard; further parts depend on contact type and duration.")]; }],
    ["infection_and_sterility", "Sterility and microbial contamination", "Annex I, Section 11", function (d) { return d.placed_on_market_sterile; }, function () { return [std("ISO 11135", "Sterilization - Ethylene oxide", "Method-dependent."), std("ISO 11137", "Sterilization - Radiation", "Method-dependent."), std("ISO 17665", "Sterilization - Moist heat", "Method-dependent."), std("ISO 11607", "Packaging for terminally sterilized medical devices")]; }],
    ["biological_origin_materials", "Materials of biological origin", "Annex I, Section 13", function (d) { return d.contains_human_or_animal_tissue_or_cells; }, function (d) {
      if (d.tissue_origin === "animal") return [std("ISO 22442", "Medical devices utilizing animal tissues and their derivatives")];
      if (d.tissue_origin === "human") return [std("Directive 2004/23/EC", "EU tissues and cells directive", "A directive, not an ISO/IEC standard.")];
      return [];
    }],
    ["incorporated_medicinal_substances", "Incorporated medicinal substances", "Annex I, Section 12", function (d) { return d.administers_medicinal_product || d.contains_ancillary_medicinal_substance || d.composed_of_substances_absorbed_or_dispersed_via_orifice_or_skin; }, function () { return []; }],
    ["software_lifecycle", "Software lifecycle and security", "Annex I, Section 17", function (d) { return d.is_software; }, function () { return [std("IEC 62304", "Medical device software - Software life cycle processes"), std("IEC 82304-1", "Health software - General requirements for product safety", "Standalone software products."), std("IEC 81001-5-1", "Health software - Security activities in the product life cycle")]; }],
    ["electrical_mechanical_safety_emc", "Electrical, mechanical and EMC safety", "Annex I, Sections 14, 18, 20", function (d) { return d.is_active; }, function () { return [std("IEC 60601-1", "Medical electrical equipment - General requirements for basic safety and essential performance"), std("IEC 60601-1-2", "Medical electrical equipment - Electromagnetic disturbances")]; }],
    ["radiation_protection", "Protection against radiation", "Annex I, Section 16", function (d) { return d.supplies_ionising_radiation || d.emits_ionising_radiation_therapeutic || d.emits_ionising_radiation_diagnostic_or_interventional || d.is_xray_diagnostic_image_recording_device; }, function () { return [std("IEC 60601-1-3", "Radiation protection in diagnostic X-ray equipment", "Modality-specific parts also apply.")]; }],
    ["active_implantable_devices", "Active implantable devices", "Annex I, Section 19", function (d) { return d.is_active_implantable_or_accessory || (d.is_active && d.is_implantable); }, function () { return [std("ISO 14708-1", "Active implantable medical devices - General requirements")]; }],
    ["measuring_function", "Measuring function", "Annex I, Section 15", function (d) { return d.has_measuring_function; }, function () { return []; }],
    ["energy_or_substance_delivery", "Energy or substance delivery", "Annex I, Section 21", function (d) { return d.administers_or_exchanges_energy || d.administers_or_removes_substances_to_from_body || d.channels_or_stores_for_infusion_administration_or_introduction; }, function () { return []; }],
  ];

  function mapStandards(input) {
    var d = normalise(input);
    return GSPR.map(function (g) {
      var applies = !!g[3](d);
      return { requirement_id: g[0], title: g[1], source_citation: g[2], applies: applies, standards: applies ? g[4](d) : [] };
    });
  }

  var api = { classify: classify, mapStandards: mapStandards, DEFAULTS: DEFAULTS, RANK: RANK };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MDREngine = api;
})(typeof window !== "undefined" ? window : this);
