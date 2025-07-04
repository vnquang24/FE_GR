/******************************************************************************
* This file was generated by ZenStack CLI.
******************************************************************************/

/* eslint-disable */
// @ts-nocheck

import type { Prisma, RescueType } from "@prisma/client";
import type { UseMutationOptions, UseQueryOptions, UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query';
import { getHooksContext } from '@zenstackhq/tanstack-query/runtime-v5/react';
import { useModelQuery, useInfiniteModelQuery, useModelMutation } from '@zenstackhq/tanstack-query/runtime-v5/react';
import type { PickEnumerable, CheckSelect, QueryError, ExtraQueryOptions, ExtraMutationOptions } from '@zenstackhq/tanstack-query/runtime-v5';
import type { PolicyCrudKind } from '@zenstackhq/runtime'
import metadata from './__model_meta';
type DefaultError = QueryError;
import { useSuspenseModelQuery, useSuspenseInfiniteModelQuery } from '@zenstackhq/tanstack-query/runtime-v5/react';
import type { UseSuspenseQueryOptions, UseSuspenseInfiniteQueryOptions } from '@tanstack/react-query';

export function useCreateRescueType(options?: Omit<(UseMutationOptions<(RescueType | undefined), DefaultError, Prisma.RescueTypeCreateArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeCreateArgs, DefaultError, RescueType, true>('RescueType', 'POST', `${endpoint}/rescueType/create`, metadata, options, fetch, true)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeCreateArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeCreateArgs>,
            options?: Omit<(UseMutationOptions<(CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined), DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeCreateArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as (CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined);
        },
    };
    return mutation;
}

export function useCreateManyRescueType(options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.RescueTypeCreateManyArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeCreateManyArgs, DefaultError, Prisma.BatchPayload, false>('RescueType', 'POST', `${endpoint}/rescueType/createMany`, metadata, options, fetch, false)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeCreateManyArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeCreateManyArgs>,
            options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeCreateManyArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as Prisma.BatchPayload;
        },
    };
    return mutation;
}

export function useFindManyRescueType<TArgs extends Prisma.RescueTypeFindManyArgs, TQueryFnData = Array<Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }>, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindManyArgs>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findMany`, args, options, fetch);
}

export function useInfiniteFindManyRescueType<TArgs extends Prisma.RescueTypeFindManyArgs, TQueryFnData = Array<Prisma.RescueTypeGetPayload<TArgs>>, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindManyArgs>, options?: Omit<UseInfiniteQueryOptions<TQueryFnData, TError, InfiniteData<TData>>, 'queryKey' | 'initialPageParam'>) {
    options = options ?? { getNextPageParam: () => null };
    const { endpoint, fetch } = getHooksContext();
    return useInfiniteModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findMany`, args, options, fetch);
}

export function useSuspenseFindManyRescueType<TArgs extends Prisma.RescueTypeFindManyArgs, TQueryFnData = Array<Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }>, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindManyArgs>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findMany`, args, options, fetch);
}

export function useSuspenseInfiniteFindManyRescueType<TArgs extends Prisma.RescueTypeFindManyArgs, TQueryFnData = Array<Prisma.RescueTypeGetPayload<TArgs>>, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindManyArgs>, options?: Omit<UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, InfiniteData<TData>>, 'queryKey' | 'initialPageParam'>) {
    options = options ?? { getNextPageParam: () => null };
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseInfiniteModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findMany`, args, options, fetch);
}

export function useFindUniqueRescueType<TArgs extends Prisma.RescueTypeFindUniqueArgs, TQueryFnData = Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindUniqueArgs>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findUnique`, args, options, fetch);
}

export function useSuspenseFindUniqueRescueType<TArgs extends Prisma.RescueTypeFindUniqueArgs, TQueryFnData = Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindUniqueArgs>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findUnique`, args, options, fetch);
}

export function useFindFirstRescueType<TArgs extends Prisma.RescueTypeFindFirstArgs, TQueryFnData = Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindFirstArgs>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findFirst`, args, options, fetch);
}

export function useSuspenseFindFirstRescueType<TArgs extends Prisma.RescueTypeFindFirstArgs, TQueryFnData = Prisma.RescueTypeGetPayload<TArgs> & { $optimistic?: boolean }, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeFindFirstArgs>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/findFirst`, args, options, fetch);
}

export function useUpdateRescueType(options?: Omit<(UseMutationOptions<(RescueType | undefined), DefaultError, Prisma.RescueTypeUpdateArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeUpdateArgs, DefaultError, RescueType, true>('RescueType', 'PUT', `${endpoint}/rescueType/update`, metadata, options, fetch, true)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeUpdateArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeUpdateArgs>,
            options?: Omit<(UseMutationOptions<(CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined), DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeUpdateArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as (CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined);
        },
    };
    return mutation;
}

export function useUpdateManyRescueType(options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.RescueTypeUpdateManyArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeUpdateManyArgs, DefaultError, Prisma.BatchPayload, false>('RescueType', 'PUT', `${endpoint}/rescueType/updateMany`, metadata, options, fetch, false)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeUpdateManyArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeUpdateManyArgs>,
            options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeUpdateManyArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as Prisma.BatchPayload;
        },
    };
    return mutation;
}

export function useUpsertRescueType(options?: Omit<(UseMutationOptions<(RescueType | undefined), DefaultError, Prisma.RescueTypeUpsertArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeUpsertArgs, DefaultError, RescueType, true>('RescueType', 'POST', `${endpoint}/rescueType/upsert`, metadata, options, fetch, true)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeUpsertArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeUpsertArgs>,
            options?: Omit<(UseMutationOptions<(CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined), DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeUpsertArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as (CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined);
        },
    };
    return mutation;
}

export function useDeleteRescueType(options?: Omit<(UseMutationOptions<(RescueType | undefined), DefaultError, Prisma.RescueTypeDeleteArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeDeleteArgs, DefaultError, RescueType, true>('RescueType', 'DELETE', `${endpoint}/rescueType/delete`, metadata, options, fetch, true)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeDeleteArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeDeleteArgs>,
            options?: Omit<(UseMutationOptions<(CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined), DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeDeleteArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as (CheckSelect<T, RescueType, Prisma.RescueTypeGetPayload<T>> | undefined);
        },
    };
    return mutation;
}

export function useDeleteManyRescueType(options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.RescueTypeDeleteManyArgs> & ExtraMutationOptions), 'mutationFn'>) {
    const { endpoint, fetch } = getHooksContext();
    const _mutation =
        useModelMutation<Prisma.RescueTypeDeleteManyArgs, DefaultError, Prisma.BatchPayload, false>('RescueType', 'DELETE', `${endpoint}/rescueType/deleteMany`, metadata, options, fetch, false)
        ;
    const mutation = {
        ..._mutation,
        mutateAsync: async <T extends Prisma.RescueTypeDeleteManyArgs>(
            args: Prisma.SelectSubset<T, Prisma.RescueTypeDeleteManyArgs>,
            options?: Omit<(UseMutationOptions<Prisma.BatchPayload, DefaultError, Prisma.SelectSubset<T, Prisma.RescueTypeDeleteManyArgs>> & ExtraMutationOptions), 'mutationFn'>
        ) => {
            return (await _mutation.mutateAsync(
                args,
                options as any
            )) as Prisma.BatchPayload;
        },
    };
    return mutation;
}

export function useAggregateRescueType<TArgs extends Prisma.RescueTypeAggregateArgs, TQueryFnData = Prisma.GetRescueTypeAggregateType<TArgs>, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.RescueTypeAggregateArgs>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/aggregate`, args, options, fetch);
}

export function useSuspenseAggregateRescueType<TArgs extends Prisma.RescueTypeAggregateArgs, TQueryFnData = Prisma.GetRescueTypeAggregateType<TArgs>, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.RescueTypeAggregateArgs>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/aggregate`, args, options, fetch);
}

export function useGroupByRescueType<TArgs extends Prisma.RescueTypeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<TArgs>>, Prisma.Extends<'take', Prisma.Keys<TArgs>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? { orderBy: Prisma.RescueTypeGroupByArgs['orderBy'] } : { orderBy?: Prisma.RescueTypeGroupByArgs['orderBy'] }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<TArgs['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<TArgs['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<TArgs['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends TArgs['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True
    ? `Error: "by" must not be empty.`
    : HavingValid extends Prisma.False
    ? {
        [P in HavingFields]: P extends ByFields
        ? never
        : P extends string
        ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
        : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`,
        ]
    }[HavingFields]
    : 'take' extends Prisma.Keys<TArgs>
    ? 'orderBy' extends Prisma.Keys<TArgs>
    ? ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields]
    : 'Error: If you provide "take", you also need to provide "orderBy"'
    : 'skip' extends Prisma.Keys<TArgs>
    ? 'orderBy' extends Prisma.Keys<TArgs>
    ? ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields]
    : 'Error: If you provide "skip", you also need to provide "orderBy"'
    : ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields], TQueryFnData = {} extends InputErrors ?
    Array<PickEnumerable<Prisma.RescueTypeGroupByOutputType, TArgs['by']> &
        {
            [P in ((keyof TArgs) & (keyof Prisma.RescueTypeGroupByOutputType))]: P extends '_count'
            ? TArgs[P] extends boolean
            ? number
            : Prisma.GetScalarType<TArgs[P], Prisma.RescueTypeGroupByOutputType[P]>
            : Prisma.GetScalarType<TArgs[P], Prisma.RescueTypeGroupByOutputType[P]>
        }
    > : InputErrors, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.SubsetIntersection<TArgs, Prisma.RescueTypeGroupByArgs, OrderByArg> & InputErrors>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/groupBy`, args, options, fetch);
}

export function useSuspenseGroupByRescueType<TArgs extends Prisma.RescueTypeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<TArgs>>, Prisma.Extends<'take', Prisma.Keys<TArgs>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? { orderBy: Prisma.RescueTypeGroupByArgs['orderBy'] } : { orderBy?: Prisma.RescueTypeGroupByArgs['orderBy'] }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<TArgs['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<TArgs['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<TArgs['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends TArgs['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True
    ? `Error: "by" must not be empty.`
    : HavingValid extends Prisma.False
    ? {
        [P in HavingFields]: P extends ByFields
        ? never
        : P extends string
        ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
        : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`,
        ]
    }[HavingFields]
    : 'take' extends Prisma.Keys<TArgs>
    ? 'orderBy' extends Prisma.Keys<TArgs>
    ? ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields]
    : 'Error: If you provide "take", you also need to provide "orderBy"'
    : 'skip' extends Prisma.Keys<TArgs>
    ? 'orderBy' extends Prisma.Keys<TArgs>
    ? ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields]
    : 'Error: If you provide "skip", you also need to provide "orderBy"'
    : ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
        ? never
        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
    }[OrderFields], TQueryFnData = {} extends InputErrors ?
    Array<PickEnumerable<Prisma.RescueTypeGroupByOutputType, TArgs['by']> &
        {
            [P in ((keyof TArgs) & (keyof Prisma.RescueTypeGroupByOutputType))]: P extends '_count'
            ? TArgs[P] extends boolean
            ? number
            : Prisma.GetScalarType<TArgs[P], Prisma.RescueTypeGroupByOutputType[P]>
            : Prisma.GetScalarType<TArgs[P], Prisma.RescueTypeGroupByOutputType[P]>
        }
    > : InputErrors, TData = TQueryFnData, TError = DefaultError>(args: Prisma.SelectSubset<TArgs, Prisma.SubsetIntersection<TArgs, Prisma.RescueTypeGroupByArgs, OrderByArg> & InputErrors>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/groupBy`, args, options, fetch);
}

export function useCountRescueType<TArgs extends Prisma.RescueTypeCountArgs, TQueryFnData = TArgs extends { select: any; } ? TArgs['select'] extends true ? number : Prisma.GetScalarType<TArgs['select'], Prisma.RescueTypeCountAggregateOutputType> : number, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeCountArgs>, options?: (Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/count`, args, options, fetch);
}

export function useSuspenseCountRescueType<TArgs extends Prisma.RescueTypeCountArgs, TQueryFnData = TArgs extends { select: any; } ? TArgs['select'] extends true ? number : Prisma.GetScalarType<TArgs['select'], Prisma.RescueTypeCountAggregateOutputType> : number, TData = TQueryFnData, TError = DefaultError>(args?: Prisma.SelectSubset<TArgs, Prisma.RescueTypeCountArgs>, options?: (Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useSuspenseModelQuery<TQueryFnData, TData, TError>('RescueType', `${endpoint}/rescueType/count`, args, options, fetch);
}

export function useCheckRescueType<TError = DefaultError>(args: { operation: PolicyCrudKind; where?: { id?: string; description?: string; name?: string }; }, options?: (Omit<UseQueryOptions<boolean, TError, boolean>, 'queryKey'> & ExtraQueryOptions)) {
    const { endpoint, fetch } = getHooksContext();
    return useModelQuery<boolean, boolean, TError>('RescueType', `${endpoint}/rescueType/check`, args, options, fetch);
}
