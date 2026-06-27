"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateNcdQuestionnaireAction } from "@/actions/patient-profile/update-ncd-questionnaire.action";
import { NCD_HEADERS, NCD_QUESTIONS } from "@/lib/ncd-questions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ncdQuestionnaireSchema, type NcdQuestionnaireSchemaType } from "@/schemas/ncd-questionnaire-schema";

interface NcdQuestionnaireEditFormProps {
    patientId: number;
    initialData?: NcdQuestionnaireSchemaType | null;
    onClose?: () => void;
}

export function NcdQuestionnaireEditForm({ patientId, initialData, onClose }: NcdQuestionnaireEditFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<NcdQuestionnaireSchemaType>>(initialData || {});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (qid: string, value: string) => {
        setFormData(prev => ({ ...prev, [qid]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Keep subfields directly
            const payload: NcdQuestionnaireSchemaType = {
                id: formData.id,
                ...NCD_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.qid]: formData[q.qid as keyof NcdQuestionnaireSchemaType] || '' }), {}),
                q19_Fbsmg: formData.q19_Fbsmg,
                q19_Fbsmmol: formData.q19_Fbsmmol,
                q19_Fbsdate: formData.q19_Fbsdate ? new Date(formData.q19_Fbsdate).toISOString() : null,
                q20_Choleval: formData.q20_Choleval,
                q20_Choledate: formData.q20_Choledate ? new Date(formData.q20_Choledate).toISOString() : null,
                q21_Ketonval: formData.q21_Ketonval,
                q21_Ketondate: formData.q21_Ketondate ? new Date(formData.q21_Ketondate).toISOString() : null,
                q22_Proteinval: formData.q22_Proteinval,
                q22_Proteindate: formData.q22_Proteindate ? new Date(formData.q22_Proteindate).toISOString() : null,
            } as NcdQuestionnaireSchemaType;

            const validation = ncdQuestionnaireSchema.safeParse(payload);
            if (!validation.success) {
                const newErrors: Record<string, string> = {};
                for (const issue of validation.error.issues) {
                    newErrors[issue.path[0] as string] = issue.message;
                }
                setErrors(newErrors);
                toast.error("Please fix the errors in the form.");
                setIsLoading(false);
                return;
            }

            setErrors({});

            const res = await updateNcdQuestionnaireAction(patientId, payload);
            if (res.success) {
                toast.success("NCD Risk Assessment saved successfully!");
                if (onClose) onClose();
            } else {
                toast.error(res.error || "Failed to save.");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const renderQuestionInput = (qid: string) => {
        const val = (formData[qid as keyof NcdQuestionnaireSchemaType] as string) || "";
        
        if (qid === "q17") {
            return (
                <Select value={val} onValueChange={(v) => handleChange(qid, v)}>
                    <SelectTrigger className="w-full mt-2"><SelectValue placeholder="Select Risk Level" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A">A: &lt;10%</SelectItem>
                        <SelectItem value="B">B: 10% to &lt;20%</SelectItem>
                        <SelectItem value="C">C: 20% to &lt;30%</SelectItem>
                        <SelectItem value="D">D: 30% to &lt;40%</SelectItem>
                        <SelectItem value="E">E: &gt;=40%</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                </Select>
            );
        }

        if (qid === "q5") {
            return (
                <div className="w-full">
                    <RadioGroup value={val} onValueChange={(v) => handleChange(qid, v)} className="flex items-center gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Y" id={`${qid}-yes`} />
                            <Label htmlFor={`${qid}-yes`} className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="N" id={`${qid}-no`} />
                            <Label htmlFor={`${qid}-no`} className="cursor-pointer">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="X" id={`${qid}-x`} />
                            <Label htmlFor={`${qid}-x`} className="cursor-pointer">Don't Know</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="N/A" id={`${qid}-na`} />
                            <Label htmlFor={`${qid}-na`} className="cursor-pointer">N/A</Label>
                        </div>
                    </RadioGroup>
                </div>
            );
        }

        // Default Yes/No for most questions
        return (
            <div className="w-full">
            <RadioGroup value={val} onValueChange={(v) => handleChange(qid, v)} className="flex items-center gap-4 mt-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Y" id={`${qid}-yes`} />
                    <Label htmlFor={`${qid}-yes`} className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="N" id={`${qid}-no`} />
                    <Label htmlFor={`${qid}-no`} className="cursor-pointer">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="N/A" id={`${qid}-na`} />
                    <Label htmlFor={`${qid}-na`} className="cursor-pointer">N/A</Label>
                </div>
            </RadioGroup>
            
            {val === "Y" && qid === "q19" && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="col-span-1">
                        <input type="text" maxLength={50} placeholder="mg/dL" className={`flex h-10 w-full rounded-md border ${errors['q19_Fbsmg'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q19_Fbsmg || ""} onChange={e => handleChange("q19_Fbsmg", e.target.value)} />
                        {errors['q19_Fbsmg'] && <p className="text-xs text-red-500 mt-1">{errors['q19_Fbsmg']}</p>}
                    </div>
                    <div className="col-span-1">
                        <input type="text" maxLength={50} placeholder="mmol/L" className={`flex h-10 w-full rounded-md border ${errors['q19_Fbsmmol'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q19_Fbsmmol || ""} onChange={e => handleChange("q19_Fbsmmol", e.target.value)} />
                        {errors['q19_Fbsmmol'] && <p className="text-xs text-red-500 mt-1">{errors['q19_Fbsmmol']}</p>}
                    </div>
                    <div className="col-span-1">
                        <input type="date" className={`flex h-10 w-full rounded-md border ${errors['q19_Fbsdate'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q19_Fbsdate ? formData.q19_Fbsdate.split('T')[0] : ""} onChange={e => handleChange("q19_Fbsdate", e.target.value)} />
                        {errors['q19_Fbsdate'] && <p className="text-xs text-red-500 mt-1">{errors['q19_Fbsdate']}</p>}
                    </div>
                </div>
            )}
            {val === "Y" && qid === "q20" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="col-span-1">
                        <input type="text" maxLength={3} placeholder="Cholesterol Value" className={`flex h-10 w-full rounded-md border ${errors['q20_Choleval'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q20_Choleval || ""} onChange={e => handleChange("q20_Choleval", e.target.value)} />
                        {errors['q20_Choleval'] && <p className="text-xs text-red-500 mt-1">{errors['q20_Choleval']}</p>}
                    </div>
                    <div className="col-span-1">
                        <input type="date" className={`flex h-10 w-full rounded-md border ${errors['q20_Choledate'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q20_Choledate ? formData.q20_Choledate.split('T')[0] : ""} onChange={e => handleChange("q20_Choledate", e.target.value)} />
                        {errors['q20_Choledate'] && <p className="text-xs text-red-500 mt-1">{errors['q20_Choledate']}</p>}
                    </div>
                </div>
            )}
            {val === "Y" && qid === "q21" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="col-span-1">
                        <input type="text" maxLength={3} placeholder="Ketone Value" className={`flex h-10 w-full rounded-md border ${errors['q21_Ketonval'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q21_Ketonval || ""} onChange={e => handleChange("q21_Ketonval", e.target.value)} />
                        {errors['q21_Ketonval'] && <p className="text-xs text-red-500 mt-1">{errors['q21_Ketonval']}</p>}
                    </div>
                    <div className="col-span-1">
                        <input type="date" className={`flex h-10 w-full rounded-md border ${errors['q21_Ketondate'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q21_Ketondate ? formData.q21_Ketondate.split('T')[0] : ""} onChange={e => handleChange("q21_Ketondate", e.target.value)} />
                        {errors['q21_Ketondate'] && <p className="text-xs text-red-500 mt-1">{errors['q21_Ketondate']}</p>}
                    </div>
                </div>
            )}
            {val === "Y" && qid === "q22" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="col-span-1">
                        <input type="text" maxLength={3} placeholder="Protein Value" className={`flex h-10 w-full rounded-md border ${errors['q22_Proteinval'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q22_Proteinval || ""} onChange={e => handleChange("q22_Proteinval", e.target.value)} />
                        {errors['q22_Proteinval'] && <p className="text-xs text-red-500 mt-1">{errors['q22_Proteinval']}</p>}
                    </div>
                    <div className="col-span-1">
                        <input type="date" className={`flex h-10 w-full rounded-md border ${errors['q22_Proteindate'] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`} value={formData.q22_Proteindate ? formData.q22_Proteindate.split('T')[0] : ""} onChange={e => handleChange("q22_Proteindate", e.target.value)} />
                        {errors['q22_Proteindate'] && <p className="text-xs text-red-500 mt-1">{errors['q22_Proteindate']}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

    return (
        <div className="space-y-6">
            {NCD_HEADERS.map(header => {
                const headerQuestions = NCD_QUESTIONS.filter(q => q.headerId === header.id);
                if (headerQuestions.length === 0) return null;

                return (
                    <Card key={header.id || 'no-header'} className="shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b py-3">
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                {header.description}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {headerQuestions.map(q => {
                                // @ts-ignore - parentQid is dynamically added
                                if (q.parentQid && formData[q.parentQid as keyof typeof formData] !== 'Y') {
                                    return null;
                                }
                                
                                return (
                                    <div key={q.qid} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center transition-all animate-in fade-in slide-in-from-top-2">
                                        <Label className="md:col-span-2 text-sm leading-relaxed">{q.text}</Label>
                                        <div className="md:col-span-1">
                                            {renderQuestionInput(q.qid)}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}

            <div className="flex justify-end gap-3 mt-6">
                {onClose && <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>}
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Assessment"}
                </Button>
            </div>
        </div>
    );
}
