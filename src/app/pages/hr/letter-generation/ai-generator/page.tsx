"use client"

import { useState, useRef } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { IconWand, IconDownload, IconArrowLeft, IconLoader2, IconSparkles } from "@tabler/icons-react"
import Link from "next/link"

const generateLetterContent = async (prompt: string, recipientName: string, senderName: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const p = prompt.toLowerCase();
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    if (p.includes("resignation")) {
        return `Date: ${date}

To,
The HR Manager,
Demandify Media

Subject: Resignation from the position of [Role]

Dear Sir/Madam,

I am writing to formally resign from my position as [Role] at Demandify Media. My last day of employment will be [Last Working Day], which is in accordance with the notice period as per my employment contract.

I would like to thank you for the opportunities for professional and personal development that you have provided me during the last [Duration] years. I have enjoyed working for the agency and appreciate the support provided me during my tenure with the company.

I will do my best to ensure a smooth handover of my responsibilities before my departure.

Sincerely,

${senderName}
[Employee ID]`;
    }

    if (p.includes("offer")) {
        return `Date: ${date}

To,
${recipientName}
[Address]

Subject: Offer of Employment

Dear ${recipientName},

We are pleased to offer you the position of [Role] at Demandify Media. We were impressed with your skills and experience and believe you will be a valuable asset to our team.

Your starting salary will be [Amount] per annum. You will be reporting to [Manager Name] and your start date will be [Start Date].

Please sign and return the duplicate copy of this letter as a token of your acceptance.

We look forward to welcoming you to the team.

Sincerely,

${senderName}
HR Manager
Demandify Media`;
    }

    if (p.includes("warning")) {
        return `Date: ${date}

To,
${recipientName}
[Employee ID]

Subject: Formal Warning Letter

Dear ${recipientName},

This letter serves as a formal warning regarding your [Reason for Warning, e.g., attendance/performance]. It has come to our attention that [Specific Details of the Issue].

We value your contribution to the company, but we must insist that you adhere to company policies. We expect to see an immediate and sustained improvement in this regard.

Failure to improve may result in further disciplinary action, up to and including termination of employment.

Sincerely,

${senderName}
HR Manager
Demandify Media`;
    }

    return `Date: ${date}

To,
${recipientName}

Subject: ${prompt}

Dear ${recipientName},

I am writing to you regarding ${prompt}.

[Content of the letter goes here based on the requirement...]

Sincerely,

${senderName}
Demandify Media`;
}

export default function AiLetterGeneratorPage() {
    const [prompt, setPrompt] = useState("")
    const [recipientName, setRecipientName] = useState("")
    const [senderName, setSenderName] = useState("HR Department")
    const [generatedContent, setGeneratedContent] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const content = await generateLetterContent(prompt, recipientName || "[Recipient Name]", senderName || "HR Department");
            setGeneratedContent(content);
        } catch (error) {
            console.error("Generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    }

    const handleDownload = async () => {
        if (!generatedContent) return;

        try {
            const pdfMakeModule = await import('pdfmake/build/pdfmake');
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

            // Get the actual pdfMake instance
            const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;

            // Set up fonts - vfs_fonts exports pdfMake.vfs
            pdfMake.vfs = (pdfFontsModule as any).pdfMake?.vfs || (pdfFontsModule as any).default;

            const paragraphs = generatedContent.split('\n').filter(line => line.trim());

            const docDefinition: any = {
                pageSize: 'A4',
                pageMargins: [40, 150, 40, 60],

                header: (currentPage: number, pageCount: number) => {
                    return {
                        stack: [
                            {
                                canvas: [
                                    { type: 'rect', x: 0, y: 0, w: 595, h: 6, color: '#B144F8' },
                                    { type: 'rect', x: 24, y: 6, w: 120, h: 6, color: '#B144F8' }
                                ]
                            },
                            {
                                columns: [
                                    {
                                        width: '*',
                                        stack: [
                                            { text: 'Demandify Media', fontSize: 20, bold: true, color: '#B144F8', margin: [40, 15, 0, 4] },
                                            { text: '415, Nyati Empress, Viman Nagar Rd, Clover Park,\nViman Nagar, Pune, Maharashtra-411014', fontSize: 9, color: '#6b7280', margin: [40, 0, 0, 8] }
                                        ]
                                    }
                                ]
                            },
                            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 0, 0, 20] }
                        ]
                    };
                },

                footer: (currentPage: number, pageCount: number) => {
                    return {
                        stack: [
                            { text: 'This is a system-generated letter.', fontSize: 8, color: '#6b7280', alignment: 'center', margin: [0, 10, 0, 8] },
                            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#f3f4f6' }] },
                            {
                                columns: [
                                    {
                                        width: '*',
                                        text: [
                                            { text: 'Demandify Media, Tower A- 415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra 411014\n', fontSize: 7, color: '#6b7280' },
                                            { text: 'www.demandifymedia.com • support@demandifymedia.com • +91 7821971890', fontSize: 7, color: '#6b7280' }
                                        ],
                                        alignment: 'center',
                                        margin: [40, 5, 40, 0]
                                    }
                                ]
                            },
                            {
                                columns: [
                                    { width: '*', text: '' },
                                    { width: 'auto', text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: '#6b7280', margin: [0, 5, 40, 0] }
                                ]
                            },
                            {
                                canvas: [
                                    { type: 'rect', x: 0, y: 10, w: 595, h: 3, color: '#B144F8' },
                                    { type: 'rect', x: 24, y: 7, w: 90, h: 3, color: '#B144F8' }
                                ]
                            }
                        ]
                    };
                },

                content: [
                    ...paragraphs.map(para => ({
                        text: para,
                        fontSize: 11,
                        lineHeight: 1.6,
                        color: '#111827',
                        margin: [0, 0, 0, para.trim() === '' ? 0 : 8]
                    }))
                ],
            };

            pdfMake.createPdf(docDefinition).download(`Letter_${recipientName || 'Generated'}.pdf`);
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to generate PDF. Please try again.');
        }
    }

    return (
        <>
            <SidebarConfig role="hr" />
            <div className="flex flex-1 flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
                <div className="flex items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pages/hr">HR</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pages/hr/letter-generation">Letter Generation</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>AI Generator</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                                <IconSparkles className="h-6 w-6 text-purple-600" />
                                AI Letter Generator
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Describe the letter you need, and let AI draft it for you
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/pages/hr/letter-generation">
                                    <IconArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Link>
                            </Button>
                            <Button onClick={handleDownload} disabled={!generatedContent}>
                                <IconDownload className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Configuration</CardTitle>
                                <CardDescription>Fill in the details for your letter</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">Recipient Name</Label>
                                    <Input id="recipient" placeholder="e.g. John Doe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sender">Sender Name / Signatory</Label>
                                    <Input id="sender" placeholder="e.g. HR Manager" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Prompt / Description</Label>
                                    <Textarea id="prompt" placeholder="e.g. Write a formal warning letter for poor attendance..." className="h-24 resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                                </div>
                                <Button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full">
                                    {isGenerating ? (
                                        <>
                                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <IconWand className="mr-2 h-4 w-4" />
                                            Generate Letter
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">Editor</CardTitle>
                                <CardDescription>Edit the generated content as needed</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <Textarea className="h-full min-h-[300px] border-0 focus-visible:ring-0 rounded-none p-4 resize-none font-mono text-sm leading-relaxed" value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} placeholder="Generated content will appear here. You can edit it directly." />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg">Live Preview</CardTitle>
                            <CardDescription>Preview how your letter will look</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className=" overflow-y-auto p-8 flex justify-center" style={{ maxHeight: '800px' }}>
                                <div ref={previewRef} className="bg-white text-black shadow-lg relative" style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: '#B144F8', zIndex: 2 }}></div>
                                    <div style={{ position: 'absolute', top: '6px', left: '24px', width: '120px', height: '6px', background: '#B144F8', zIndex: 2 }}></div>

                                    <div style={{ padding: '40px 48px 20px 48px', position: 'relative', zIndex: 1, minHeight: 'calc(297mm - 9px)', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', marginTop: '80px' }}>
                                            <div>
                                                <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.2px', color: '#B144F8', marginBottom: '4px' }}>Demandify Media</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '250px', lineHeight: '1.4' }}>415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra-411014</div>
                                            </div>
                                        </div>

                                        <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '32px' }}></div>

                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', color: '#111827', flex: 1, marginBottom: '20px' }}>
                                            {generatedContent || (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '80px 20px' }}>
                                                    <IconSparkles style={{ height: '64px', width: '64px', color: '#cbd5e1', marginBottom: '16px' }} />
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Letter content will appear here...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingBottom: '10px' }}>
                                            <div style={{ textAlign: 'center', fontSize: '10px', color: '#6b7280', marginBottom: '12px' }}>This is a system-generated letter.</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#6b7280', gap: '8px', flexWrap: 'wrap', lineHeight: '1.5', borderTop: '1px solid #f3f4f6', paddingTop: '8px', paddingBottom: '8px' }}>
                                                <span>Demandify Media, Tower A- 415, Nyati Empress, Viman Nagar Rd, Clover Park, Viman Nagar, Pune, Maharashtra 411014</span>
                                                <span>•</span>
                                                <span>www.demandifymedia.com</span>
                                                <span>•</span>
                                                <span>support@demandifymedia.com</span>
                                                <span>•</span>
                                                <span>+91 7821971890</span>
                                            </div>
                                        </div>

                                        <div style={{ height: '6px', background: '#B144F8', marginLeft: '-48px', marginRight: '-48px', marginBottom: '-20px' }}></div>
                                        <div style={{ height: '6px', background: '#B144F8', width: '90px', marginLeft: '-24px', marginBottom: '-20px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
