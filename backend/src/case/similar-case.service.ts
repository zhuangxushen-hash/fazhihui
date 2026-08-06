import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';

@Injectable()
export class SimilarCaseService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  async searchSimilarCases(params: {
    case_type?: string;
    amount?: number;
    court?: string;
    year?: number;
    orgId?: string;
  }): Promise<{
    data: Array<Case & { similarity: number }>;
    total: number;
  }> {
    const query = this.caseRepository.createQueryBuilder('case');

    if (params.orgId) {
      query.andWhere('case.organization_id = :orgId', { orgId: params.orgId });
    }

    if (params.case_type) {
      query.andWhere('case.case_type = :caseType', { caseType: params.case_type });
    }

    if (params.court) {
      query.andWhere('case.court LIKE :court', { court: `%${params.court}%` });
    }

    if (params.year) {
      const yearStart = new Date(`${params.year}-01-01`);
      const yearEnd = new Date(`${params.year}-12-31`);
      query.andWhere('case.created_at BETWEEN :yearStart AND :yearEnd', { yearStart, yearEnd });
    }

    query.andWhere('case.status = :status', { status: 'closed' });
    query.orderBy('case.updated_at', 'DESC');
    query.limit(50);

    const cases = await query.getMany();

    const results = cases.map((caseItem) => {
      let similarity = 0;
      const weights = {
        case_type: 0.3,
        amount: 0.25,
        court: 0.25,
        year: 0.2,
      };

      if (params.case_type && caseItem.case_type === params.case_type) {
        similarity += weights.case_type;
      }

      if (params.amount && caseItem.amount) {
        const diff = Math.abs(Number(caseItem.amount) - params.amount);
        const base = Math.max(Number(caseItem.amount), params.amount);
        const amountScore = Math.max(0, 1 - diff / base);
        similarity += weights.amount * amountScore;
      }

      if (params.court && caseItem.court) {
        if (caseItem.court.includes(params.court)) {
          similarity += weights.court;
        }
      }

      if (params.year && caseItem.created_at) {
        const caseYear = new Date(caseItem.created_at).getFullYear();
        if (caseYear === params.year) {
          similarity += weights.year;
        } else {
          const yearDiff = Math.abs(caseYear - params.year);
          if (yearDiff <= 2) {
            similarity += weights.year * (1 - yearDiff * 0.3);
          }
        }
      }

      return {
        ...caseItem,
        similarity: Math.round(similarity * 100) / 100,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    return {
      data: results,
      total: results.length,
    };
  }

  async getCaseMatchingStats(orgId: string): Promise<{
    total_cases: number;
    case_type_distribution: Array<{ case_type: string; count: number }>;
    court_distribution: Array<{ court: string; count: number }>;
    average_amount: number;
    recent_cases_count: number;
  }> {
    const query = this.caseRepository.createQueryBuilder('case')
      .where('case.status = :status', { status: 'closed' });

    if (orgId) {
      query.andWhere('case.organization_id = :orgId', { orgId });
    }

    const cases = await query.getMany();

    const caseTypeMap = new Map<string, number>();
    const courtMap = new Map<string, number>();
    let totalAmount = 0;
    let countWithAmount = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let recentCount = 0;

    for (const caseItem of cases) {
      if (caseItem.case_type) {
        caseTypeMap.set(caseItem.case_type, (caseTypeMap.get(caseItem.case_type) || 0) + 1);
      }
      if (caseItem.court) {
        courtMap.set(caseItem.court, (courtMap.get(caseItem.court) || 0) + 1);
      }
      if (caseItem.amount) {
        totalAmount += Number(caseItem.amount);
        countWithAmount++;
      }
      if (caseItem.created_at && new Date(caseItem.created_at) >= thirtyDaysAgo) {
        recentCount++;
      }
    }

    const case_type_distribution = Array.from(caseTypeMap.entries())
      .map(([case_type, count]) => ({ case_type, count }))
      .sort((a, b) => b.count - a.count);

    const court_distribution = Array.from(courtMap.entries())
      .map(([court, count]) => ({ court, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total_cases: cases.length,
      case_type_distribution,
      court_distribution,
      average_amount: countWithAmount > 0 ? Math.round(totalAmount / countWithAmount) : 0,
      recent_cases_count: recentCount,
    };
  }
}